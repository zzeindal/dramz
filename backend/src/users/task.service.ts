import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument, TaskType } from './schemas/task.schema';
import { TaskCompletion, TaskCompletionDocument, CompletionStatus } from './schemas/task-completion.schema';
import { User, UserDocument } from './schemas/user.schema';
import { BalanceTransaction, BalanceTransactionDocument, TransactionType } from './schemas/balance-transaction.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const TASK_COOLDOWN_HOURS = 24; // 24 часа между выполнениями одного задания

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(TaskCompletion.name) private taskCompletionModel: Model<TaskCompletionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(BalanceTransaction.name) private balanceTransactionModel: Model<BalanceTransactionDocument>,
  ) {}

  /**
   * Создать задание (админка)
   */
  async createTask(createTaskDto: CreateTaskDto, adminId?: string): Promise<TaskDocument> {
    const task = new this.taskModel({
      ...createTaskDto,
      createdBy: adminId,
    });
    return task.save();
  }

  /**
   * Получить все задания (админка)
   */
  async getAllTasks(): Promise<TaskDocument[]> {
    return this.taskModel.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * Получить задание по ID (админка)
   */
  async getTaskById(taskId: string): Promise<TaskDocument> {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }
    return task;
  }

  /**
   * Обновить задание (админка)
   */
  async updateTask(taskId: string, updateTaskDto: UpdateTaskDto): Promise<TaskDocument> {
    const task = await this.getTaskById(taskId);
    Object.assign(task, updateTaskDto);
    return task.save();
  }

  /**
   * Удалить задание (админка)
   */
  async deleteTask(taskId: string): Promise<void> {
    const task = await this.getTaskById(taskId);
    await task.deleteOne();
  }

  /**
   * Получить активные задания для пользователя
   */
  async getActiveTasksForUser(telegramId: number) {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    const activeTasks = await this.taskModel.find({ isActive: true }).exec();

    // Получаем последние выполнения заданий пользователем
    const completions = await this.taskCompletionModel
      .find({ userId: user._id })
      .sort({ completedAt: -1 })
      .exec();

    // Группируем по taskId, чтобы получить последнее выполнение каждого задания
    const lastCompletions = new Map<string, TaskCompletionDocument>();
    completions.forEach((completion) => {
      const taskId = completion.taskId.toString();
      if (!lastCompletions.has(taskId)) {
        lastCompletions.set(taskId, completion);
      }
    });

    return activeTasks.map((task) => {
      const lastCompletion = lastCompletions.get(task._id.toString());
      const canComplete = this.canCompleteTask(lastCompletion);

      return {
        id: task._id,
        title: task.title,
        description: task.description,
        reward: task.reward,
        type: task.type,
        link: task.link,
        canComplete,
        nextAvailableAt: lastCompletion
          ? new Date(lastCompletion.completedAt.getTime() + TASK_COOLDOWN_HOURS * 60 * 60 * 1000)
          : null,
        lastCompletedAt: lastCompletion?.completedAt || null,
        status: lastCompletion?.status || null,
      };
    });
  }

  /**
   * Выполнить задание (пользователь)
   */
  async completeTask(telegramId: number, taskId: string, proofLink: string): Promise<TaskCompletionDocument> {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    const task = await this.getTaskById(taskId);
    if (!task.isActive) {
      throw new BadRequestException('Task is not active');
    }

    // Для ручных заданий требуется ссылка на доказательство
    if (task.type === TaskType.MANUAL && !proofLink) {
      throw new BadRequestException('Proof link is required for manual tasks');
    }

    // Для автоматических заданий нельзя выполнить вручную
    if (task.type !== TaskType.MANUAL) {
      throw new BadRequestException('This task is automatic and cannot be completed manually');
    }

    // Проверяем, можно ли выполнить задание
    const lastCompletion = await this.taskCompletionModel
      .findOne({ userId: user._id, taskId: new Types.ObjectId(taskId) })
      .sort({ completedAt: -1 })
      .exec();

    if (!this.canCompleteTask(lastCompletion)) {
      const nextAvailableAt = new Date(
        lastCompletion.completedAt.getTime() + TASK_COOLDOWN_HOURS * 60 * 60 * 1000,
      );
      throw new BadRequestException(
        `Задание можно выполнить снова через ${Math.ceil((nextAvailableAt.getTime() - Date.now()) / 1000 / 60 / 60)} часов`,
      );
    }

    // Создаем запись о выполнении (статус PENDING для ручной модерации)
    const completion = new this.taskCompletionModel({
      userId: user._id,
      taskId: task._id,
      status: CompletionStatus.PENDING,
      completedAt: new Date(),
      proofLink: proofLink, // Сохраняем ссылку на доказательство
    });
    await completion.save();

    return completion;
  }

  /**
   * Модерировать задание (админка)
   */
  async moderateTaskCompletion(
    completionId: string,
    status: CompletionStatus,
    adminId: string,
    note?: string,
  ): Promise<TaskCompletionDocument> {
    const completion = await this.taskCompletionModel.findById(completionId).exec();
    if (!completion) {
      throw new NotFoundException(`Task completion with ID ${completionId} not found`);
    }

    if (completion.status !== CompletionStatus.PENDING) {
      throw new BadRequestException('Task completion is already moderated');
    }

    completion.status = status;
    completion.moderatedBy = new Types.ObjectId(adminId);
    completion.moderationNote = note;

    // Если одобрено, выдаем награду
    if (status === CompletionStatus.COMPLETED) {
      await this.grantReward(completion);
    }

    return completion.save();
  }

  /**
   * Автоматически проверить и выдать награду за автоматические задания
   */
  async checkAndRewardAutomaticTask(
    userId: Types.ObjectId,
    taskType: TaskType,
    additionalData?: { seriesId?: Types.ObjectId; referredUserId?: Types.ObjectId },
  ): Promise<void> {
    // Находим активные задания данного типа
    const tasks = await this.taskModel.find({ type: taskType, isActive: true }).exec();

    for (const task of tasks) {
      // Проверяем, можно ли выполнить задание
      const lastCompletion = await this.taskCompletionModel
        .findOne({ userId, taskId: task._id })
        .sort({ completedAt: -1 })
        .exec();

      if (!this.canCompleteTask(lastCompletion)) {
        continue; // Пропускаем, если не прошло 24 часа
      }

      // Проверяем, не было ли уже выполнено сегодня
      const todayCompletion = await this.taskCompletionModel
        .findOne({
          userId,
          taskId: task._id,
          status: CompletionStatus.COMPLETED,
          completedAt: {
            $gte: new Date(Date.now() - TASK_COOLDOWN_HOURS * 60 * 60 * 1000),
          },
        })
        .exec();

      if (todayCompletion) {
        continue; // Уже выполнено сегодня
      }

      // Создаем запись о выполнении и сразу выдаем награду
      const completion = new this.taskCompletionModel({
        userId,
        taskId: task._id,
        status: CompletionStatus.COMPLETED,
        completedAt: new Date(),
        rewardedAt: new Date(),
        seriesId: additionalData?.seriesId,
        referredUserId: additionalData?.referredUserId,
      });
      await completion.save();

      // Выдаем награду
      await this.grantReward(completion);
    }
  }

  /**
   * Выдать награду за выполнение задания
   */
  private async grantReward(completion: TaskCompletionDocument): Promise<void> {
    const task = await this.taskModel.findById(completion.taskId).exec();
    if (!task) {
      return;
    }

    const user = await this.userModel.findById(completion.userId).exec();
    if (!user) {
      return;
    }

    // Начисляем короны
    user.crowns += task.reward;
    await user.save();

    // Создаем транзакцию
    const transaction = new this.balanceTransactionModel({
      userId: user._id,
      amount: task.reward,
      type: TransactionType.OTHER,
      description: `Награда за задание: ${task.title}`,
    });
    await transaction.save();

    // Обновляем время выдачи награды
    completion.rewardedAt = new Date();
    await completion.save();
  }

  /**
   * Проверка, можно ли выполнить задание
   */
  private canCompleteTask(lastCompletion: TaskCompletionDocument | null): boolean {
    if (!lastCompletion) {
      return true; // Никогда не выполнялось
    }

    // Проверяем, прошло ли 24 часа с последнего выполнения
    const now = new Date();
    const lastCompleted = new Date(lastCompletion.completedAt);
    const hoursSinceLastCompletion = (now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastCompletion >= TASK_COOLDOWN_HOURS;
  }

  /**
   * Получить историю выполнения заданий пользователем
   */
  async getUserTaskHistory(telegramId: number, limit: number = 20) {
    const user = await this.userModel.findOne({ telegramId }).exec();
    if (!user) {
      throw new NotFoundException(`User with telegramId ${telegramId} not found`);
    }

    const completions = await this.taskCompletionModel
      .find({ userId: user._id })
      .populate('taskId', 'title reward type')
      .sort({ completedAt: -1 })
      .limit(limit)
      .exec();

    return completions.map((completion) => ({
      id: completion._id,
      task: completion.taskId
        ? {
            id: (completion.taskId as any)._id,
            title: (completion.taskId as any).title,
            reward: (completion.taskId as any).reward,
            type: (completion.taskId as any).type,
          }
        : null,
      status: completion.status,
      completedAt: completion.completedAt,
      rewardedAt: completion.rewardedAt,
    }));
  }

  /**
   * Получить все выполнения заданий для модерации (админка)
   */
  async getPendingCompletions() {
    const completions = await this.taskCompletionModel
      .find({ status: CompletionStatus.PENDING })
      .populate('userId', 'telegramId username displayName')
      .populate('taskId', 'title reward type')
      .sort({ completedAt: -1 })
      .exec();

    return completions.map((completion) => ({
      id: completion._id,
      user: completion.userId
        ? {
            id: (completion.userId as any)._id,
            telegramId: (completion.userId as any).telegramId,
            username: (completion.userId as any).username,
            displayName: (completion.userId as any).displayName,
          }
        : null,
      task: completion.taskId
        ? {
            id: (completion.taskId as any)._id,
            title: (completion.taskId as any).title,
            reward: (completion.taskId as any).reward,
            type: (completion.taskId as any).type,
          }
        : null,
      proofLink: completion.proofLink,
      completedAt: completion.completedAt,
      status: completion.status,
    }));
  }
}

