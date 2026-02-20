class AddQuantityToTrades < ActiveRecord::Migration[8.0]
  def change
    add_column :trades, :quantity, :decimal, precision: 20, scale: 8
  end
end
