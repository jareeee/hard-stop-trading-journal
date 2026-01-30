class BalanceTransaction < ApplicationRecord
  belongs_to :user

  validates :transaction_type, presence: true, inclusion: { in: %w[top_up withdrawal adjustment] }
  validates :amount, presence: true, numericality: true
  validates :balance_after, presence: true, numericality: true

  scope :ordered, -> { order(created_at: :desc) }
  scope :top_ups, -> { where(transaction_type: "top_up") }
  scope :withdrawals, -> { where(transaction_type: "withdrawal") }

  # Get current balance for user
  def self.current_balance_for(user)
    user.balance_transactions.order(created_at: :desc).first&.balance_after || 0
  end

  # Get starting balance (first transaction)
  def self.starting_balance_for(user)
    user.balance_transactions.order(created_at: :asc).first&.balance_after || 10000
  end
end
