class CreateRules < ActiveRecord::Migration[8.0]
  def change
    create_table :rules do |t|
      t.references :user, null: false, foreign_key: true

      t.integer :max_consecutive_losses
      t.decimal :max_daily_drawdown_percent, precision: 5, scale: 2

      t.integer :max_trades_per_session
      t.integer :max_trades_per_hour
      t.integer :cooldown_minutes_after_loss

      t.boolean :enforce_strategy, default: false

      t.timestamps
    end
  end
end
