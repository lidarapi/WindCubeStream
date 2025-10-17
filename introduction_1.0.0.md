Welcome to Lidar streaming API documentation.

This streaming API works using Websockets, either in Server Mode by connecting a client to the following URL: "ws://host/lidar_stream/v1" (or you can use secure websockets [wss://] if you configured a selfsigned certificate or your own SSL certificate), or in Client Mode by configuring your websocket server in Lidar's configuration.

In Server Mode, the API client must request an authentication "token" via the REST API using login route and provide it in each request as shown below. For more details read [REST API documentation](../doc)

The general format of requests is:

```json
{
    "token": "tokenRetrievedViaRestAPI",
    "event": "event_name",
    "payload":
    {
        "parameter1": "value1",
        "parameter2": "value2"
    }
}
```

The responses from server are in the same format, except that the "token" parameter is removed.

Keep in mind that tokens have an expiration date, and streaming server will automatically close websockets connections when it tries to send a message to a client who has an outdated token. To keep the connection alive, use REST API to get a new token and provide it to streaming API by subscribing again to at least one data. In that case streaming API will store this new token for all current subscriptions.
