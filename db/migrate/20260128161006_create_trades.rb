class CreateTrades < ActiveRecord::Migration[8.0]
  def change
    create_table :trades do |t|
      t.references :session, null: false, foreign_key: true
      t.references :strategy, null: true, foreign_key: true

      t.string :asset, null: false
      t.string :direction, null: false  # long / short

      t.decimal :entry_price, precision: 20, scale: 8, null: false
      t.decimal :stop_loss, precision: 20, scale: 8
      t.decimal :target_price, precision: 20, scale: 8
      t.decimal :close_price, precision: 20, scale: 8

      t.decimal :risk_percent, precision: 5, scale: 2
      t.decimal :pnl_gross, precision: 15, scale: 2
      t.decimal :fee, precision: 15, scale: 2
      t.decimal :pnl_net, precision: 15, scale: 2

      t.string :result  # win / loss / breakeven

      t.datetime :opened_at, null: false
      t.datetime :closed_at

      t.timestamps
    end

    add_index :trades, :asset
    add_index :trades, :direction
    add_index :trades, :result
    add_index :trades, :opened_at
    add_index :trades, :closed_at
  end
end
