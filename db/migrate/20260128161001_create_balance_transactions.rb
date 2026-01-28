class CreateBalanceTransactions < ActiveRecord::Migration[8.0]
  def change
    create_table :balance_transactions do |t|
      t.references :user, null: false, foreign_key: true

      t.string :transaction_type, null: false  # top_up / withdrawal / adjustment
      t.decimal :amount, precision: 15, scale: 2, null: false
      t.decimal :balance_after, precision: 15, scale: 2, null: false

      t.text :note

      t.timestamps
    end

    add_index :balance_transactions, :transaction_type
    add_index :balance_transactions, :created_at
  end
end
