'use client'

import Modal from './Modal'
import CrownIcon from './CrownIcon'

type Transaction = {
  id: number
  type: string
  description: string
  amount: number
  crowns: number
  usdt: number
  date: string
  time: string
  seriesName?: string
  seriesCount?: string
  paymentMethod?: string
}

export default function TransactionDetailModal({
  transaction,
  onClose
}: {
  transaction: Transaction
  onClose: () => void
}) {
  const title = transaction.type === 'purchase' ? 'Покупка серий' : transaction.description

  return (
    <Modal open={true} onClose={onClose} title={title}>
      <div className="space-y-3">
        <div
          style={{
            background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
            borderRadius: '9px',
            pointerEvents: 'none',
            padding: '1px'
          }}
        >
          <div
            className="rounded-[8px] px-3 py-3 h-full w-full flex items-center justify-between relative overflow-hidden"
            style={{
              backgroundColor: 'rgba(20, 16, 38, 0.9)'
            }}
          >
            <div className="text-white/70 text-sm">
              {transaction.type === 'purchase' ? 'Дата покупки:' : 'Дата:'}
            </div>
            <div className="text-white text-sm flex items-center gap-2">
              <span>{transaction.date}</span>
              <span className="text-white/50">{transaction.time}</span>
            </div>
          </div>
        </div>

        {transaction.seriesName && (
          <div
            style={{
              background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
              borderRadius: '9px',
              pointerEvents: 'none',
              padding: '1px'
            }}
          >
            <div
              className="rounded-[8px] px-3 py-3 h-full w-full flex items-center justify-between relative overflow-hidden"
              style={{
                backgroundColor: 'rgba(20, 16, 38, 0.9)'
              }}
            >
              <div className="text-white/70 text-sm">Куплено:</div>
              <div className="text-white text-sm text-right">
                <div>{transaction.seriesName}</div>
                <div className="text-white/50 text-xs mt-0.5">{transaction.seriesCount}</div>
              </div>
            </div>
          </div>
        )}

        {transaction.usdt !== 0 && (
          <div
            style={{
              background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
              borderRadius: '9px',
              pointerEvents: 'none',
              padding: '1px'
            }}
          >
            <div
              className="rounded-[8px] px-3 py-3 h-full w-full flex items-center justify-between relative overflow-hidden"
              style={{
                backgroundColor: 'rgba(20, 16, 38, 0.9)'
              }}
            >
              <div className="text-white/70 text-sm">Списано средств:</div>
              <div className="text-white text-sm">{Math.abs(transaction.usdt)} USDT</div>
            </div>
          </div>
        )}

        {transaction.crowns !== 0 && (
          <div
            style={{
              background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
              borderRadius: '9px',
              pointerEvents: 'none',
              padding: '1px'
            }}
          >
            <div
              className="rounded-[8px] px-3 py-3 h-full w-full flex items-center justify-between relative overflow-hidden"
              style={{
                backgroundColor: 'rgba(20, 16, 38, 0.9)'
              }}
            >
              <div className="text-white/70 text-sm">
                {transaction.amount > 0 ? 'Начислено корон:' : 'Списано корон:'}
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-sm flex items-center gap-1 ${transaction.amount > 0 ? 'text-[#8F37FF]' : 'text-white'}`}>
                  {Math.abs(transaction.crowns)} <CrownIcon className="w-4 h-4" />
                </div>
                {transaction.usdt !== 0 && transaction.amount < 0 && (
                  <div className="text-white/50 text-xs">~{Math.abs(transaction.crowns)} USDT</div>
                )}
              </div>
            </div>
          </div>
        )}

        {transaction.paymentMethod && (
          <div
            style={{
              background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 80%)',
              borderRadius: '9px',
              pointerEvents: 'none',
              padding: '1px'
            }}
          >
            <div
              className="rounded-[8px] px-3 py-3 h-full w-full relative overflow-hidden"
              style={{
                backgroundColor: 'rgba(20, 16, 38, 0.9)'
              }}
            >
              <div className="text-white/70 text-sm mb-3">Способ оплаты:</div>
              <img src="/visa.svg" alt="VISA" className="h-12 border rounded-md object-cover" />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

