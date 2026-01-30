class BalanceTransactionsController < ApplicationController
  before_action :authenticate_user!

  def create
    # Start a transaction to ensure balance is updated correctly
    BalanceTransaction.transaction do
      last_transaction = current_user.balance_transactions.order(created_at: :desc).first
      current_balance = last_transaction&.balance_after || 0

      amount = BigDecimal(transaction_params[:amount].to_s)
      type = transaction_params[:transaction_type]

      # Calculate balance after
      balance_after = if type == "top_up"
                        current_balance + amount
      elsif type == "withdrawal"
                        current_balance - amount
      else
                        current_balance # Fallback for adjustments
      end

      @transaction = current_user.balance_transactions.build(
        transaction_params.merge(
          balance_after: balance_after,
          created_at: transaction_params[:created_at] || Time.current
        )
      )

      if @transaction.save
        render json: {
          status: "success",
          message: "Transaction recorded successfully",
          data: @transaction
        }, status: :created
      else
        render json: {
          status: "error",
          errors: @transaction.errors.full_messages
        }, status: :unprocessable_entity
        raise ActiveRecord::Rollback
      end
    end
  end

  private

  def transaction_params
    params.require(:balance_transaction).permit(:transaction_type, :amount, :note, :created_at)
  end
end
