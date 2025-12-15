import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReferralDocument = Referral & Document;

export enum ReferralLinkType {
    YOUTUBE = 'youtube',
    TELEGRAM = 'telegram',
    INSTAGRAM = 'instagram',
    X = 'x'
}

@Schema({ timestamps: true })
export class ReferralLink {
    @Prop({ type: String, enum: ReferralLinkType })
    type: ReferralLinkType;

    @Prop({ required: true })
    code: string;

    @Prop({ required: true, default: 0 })
    activatedCount: number;
}

export const ReferralLinkSchema = SchemaFactory.createForClass(ReferralLink);

@Schema({ timestamps: true })
export class Referral {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    referral: Types.ObjectId;

    @Prop({ required: true, default: Date.now })
    referredAt: Date;

    @Prop({ type: ReferralLinkSchema })
    activatedLink: ReferralLink
}

export const ReferralSchema = SchemaFactory.createForClass(Referral);

