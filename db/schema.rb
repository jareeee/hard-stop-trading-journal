# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_02_20_011000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "balance_transactions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "transaction_type", null: false
    t.decimal "amount", precision: 15, scale: 2, null: false
    t.decimal "balance_after", precision: 15, scale: 2, null: false
    t.text "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_balance_transactions_on_created_at"
    t.index ["transaction_type"], name: "index_balance_transactions_on_transaction_type"
    t.index ["user_id"], name: "index_balance_transactions_on_user_id"
  end

  create_table "rules", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "max_consecutive_losses"
    t.decimal "max_daily_drawdown_percent", precision: 5, scale: 2
    t.integer "max_trades_per_session"
    t.integer "max_trades_per_hour"
    t.integer "cooldown_minutes_after_loss"
    t.boolean "enforce_strategy", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_rules_on_user_id"
  end

  create_table "session_strategies", force: :cascade do |t|
    t.bigint "session_id", null: false
    t.bigint "strategy_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["session_id", "strategy_id"], name: "index_session_strategies_on_session_id_and_strategy_id", unique: true
    t.index ["session_id"], name: "index_session_strategies_on_session_id"
    t.index ["strategy_id"], name: "index_session_strategies_on_strategy_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "rule_id"
    t.string "status", default: "active", null: false
    t.datetime "started_at", null: false
    t.datetime "ended_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["rule_id"], name: "index_sessions_on_rule_id"
    t.index ["started_at"], name: "index_sessions_on_started_at"
    t.index ["status"], name: "index_sessions_on_status"
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "strategies", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name", null: false
    t.text "description"
    t.boolean "is_active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "name"], name: "index_strategies_on_user_id_and_name", unique: true
    t.index ["user_id"], name: "index_strategies_on_user_id"
  end

  create_table "trades", force: :cascade do |t|
    t.bigint "session_id", null: false
    t.bigint "strategy_id"
    t.string "asset", null: false
    t.string "direction", null: false
    t.decimal "entry_price", precision: 20, scale: 8, null: false
    t.decimal "stop_loss", precision: 20, scale: 8
    t.decimal "target_price", precision: 20, scale: 8
    t.decimal "close_price", precision: 20, scale: 8
    t.decimal "risk_percent", precision: 5, scale: 2
    t.decimal "pnl_gross", precision: 15, scale: 2
    t.decimal "fee", precision: 15, scale: 2
    t.decimal "pnl_net", precision: 15, scale: 2
    t.string "result"
    t.datetime "opened_at", null: false
    t.datetime "closed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "quantity", precision: 20, scale: 8
    t.index ["asset"], name: "index_trades_on_asset"
    t.index ["closed_at"], name: "index_trades_on_closed_at"
    t.index ["direction"], name: "index_trades_on_direction"
    t.index ["opened_at"], name: "index_trades_on_opened_at"
    t.index ["result"], name: "index_trades_on_result"
    t.index ["session_id"], name: "index_trades_on_session_id"
    t.index ["strategy_id"], name: "index_trades_on_strategy_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "jti", null: false
    t.string "first_name"
    t.string "last_name"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "warnings", force: :cascade do |t|
    t.bigint "session_id", null: false
    t.bigint "trade_id"
    t.string "warning_type", null: false
    t.text "message"
    t.datetime "triggered_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["session_id"], name: "index_warnings_on_session_id"
    t.index ["trade_id"], name: "index_warnings_on_trade_id"
    t.index ["triggered_at"], name: "index_warnings_on_triggered_at"
    t.index ["warning_type"], name: "index_warnings_on_warning_type"
  end

  add_foreign_key "balance_transactions", "users"
  add_foreign_key "rules", "users"
  add_foreign_key "session_strategies", "sessions"
  add_foreign_key "session_strategies", "strategies"
  add_foreign_key "sessions", "rules"
  add_foreign_key "sessions", "users"
  add_foreign_key "strategies", "users"
  add_foreign_key "trades", "sessions"
  add_foreign_key "trades", "strategies"
  add_foreign_key "warnings", "sessions"
  add_foreign_key "warnings", "trades"
end
