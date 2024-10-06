const mqtt = require('mqtt');

GT.pskMqttClient = null;
GT.pskMqttUrl = "mqtt://mqtt.pskreporter.info:1883";
GT.pskCloseTimer = null;

function openPskMqtt()
{
    if (GT.pskCloseTimer != null)
    {
        nodeTimers.clearTimeout(GT.pskCloseTimer);
        GT.pskCloseTimer = null;
    }

    if (GT.spotView == 0)
    {
        GT.pskCloseTimer = nodeTimers.setTimeout(closePskMqtt, 60000);
        return;
    }

    if (GT.pskMqttClient != null) return;

    if (GT.mapSettings.offlineMode == true) return;

    if (GT.appSettings.myCall == null || GT.appSettings.myCall == "NOCALL" || GT.appSettings.myCall == "") return;

    const dottedCallsign = GT.appSettings.myCall.replaceAll("/", ".");
    const clientId = `GT2_${dottedCallsign}_${GT.appSettings.myGrid}`;
    const topic = `pskr/filter/v2/+/+/${dottedCallsign}/#`;

    console.log("ID: ", clientId);
    console.log("Topic: ", topic);

    GT.pskMqttClient = mqtt.connect(GT.pskMqttUrl, {
        clientId,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 60000,
    });

    GT.pskMqttClient.on('connect', () => {
        console.log('Connected');
        
        GT.pskMqttClient.subscribe([topic], () => {
            console.log(`Subscribe to topic '${topic}'`);
        })
    });
    
    GT.pskMqttClient.on('message', (topic, payload) => {
        addNewMqttPskSpot(JSON.parse(payload));
    });
}

function closePskMqtt()
{
    if (GT.pskCloseTimer != null)
    {
        nodeTimers.clearTimeout(GT.pskCloseTimer);
        GT.pskCloseTimer = null;
    }

    if (GT.pskMqttClient != null)
    {
        GT.pskMqttClient.end();
        GT.pskMqttClient = null;
        console.log("Closed");
    }
}