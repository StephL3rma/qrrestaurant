import { prisma } from "./prisma"

export interface PaymentLogData {
  orderId: string
  action: 'cash_selected' | 'cash_confirmed' | 'card_payment' | 'back_to_payment' | 'status_change'
  amount?: number
  paymentId?: string
  previousStatus?: string
  newStatus?: string
  metadata?: Record<string, unknown>
}

export async function createPaymentLog(data: PaymentLogData) {
  try {
    const log = await prisma.paymentLog.create({
      data: {
        orderId: data.orderId,
        action: data.action,
        amount: data.amount,
        paymentId: data.paymentId,
        previousStatus: data.previousStatus,
        newStatus: data.newStatus,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      }
    })

    console.log(`✅ Payment log created: ${data.action} for order ${data.orderId}`)
    return log
  } catch (error) {
    console.error(`❌ Failed to create payment log for order ${data.orderId}:`, error)
    // Don't throw - logging should not break the main flow
    return null
  }
}

export async function getPaymentLogs(orderId: string) {
  try {
    return await prisma.paymentLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' }
    })
  } catch (error) {
    console.error(`Failed to fetch payment logs for order ${orderId}:`, error)
    return []
  }
}

export async function getPaymentLogsSummary(orderId: string) {
  const logs = await getPaymentLogs(orderId)

  return {
    totalLogs: logs.length,
    actions: logs.map(log => ({
      action: log.action,
      timestamp: log.createdAt,
      details: log.metadata ? JSON.parse(log.metadata as string) : null
    })),
    hasMultiplePaymentAttempts: logs.filter(log =>
      ['cash_selected', 'card_payment'].includes(log.action)
    ).length > 1,
    lastPaymentMethod: logs
      .filter(log => ['cash_selected', 'card_payment'].includes(log.action))
      .slice(-1)[0]?.action || null
  }
}