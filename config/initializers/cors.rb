# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    allowed_origins = ENV.fetch("CORS_ALLOWED_ORIGINS", "")
      .split(",")
      .map(&:strip)
      .reject(&:empty?)

    origins(*allowed_origins, /\Ahttp:\/\/localhost:\d+\z/, /\Ahttp:\/\/127\.0\.0\.1:\d+\z/)

    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
      expose: [ "Authorization" ]
  end
end
