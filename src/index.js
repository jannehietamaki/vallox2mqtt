const mqtt = require("mqtt");
const Vallox = require("@danielbayerlein/vallox-api");

const client = new Vallox({ ip: process.env.HOST, port: 80 });
const profiles = client.PROFILES;

const topic = "vallox2mqtt";

const mqttClient = mqtt.connect(process.env.MQTT || "mqtt://localhost:1883");

const updateProfile = async () => {
  const result = await client.getProfile();
  const profile = Object.keys(profiles).find(key => profiles[key] === result);
  console.log("Profile:", profile);
  await mqttClient.publish(topic, JSON.stringify({ profile }));
};

mqttClient.on('connect', function () {
  mqttClient.subscribe(topic + '/set', async (err) => {
    if (!err) {
      await updateProfile();
    }
  })
});

mqttClient.on('message', async (topic, message) => {
  const msg = JSON.parse(message.toString());
  const p = profiles[msg.profile];
  if (p) {
    console.log("Set profile:", p);
    await client.setProfile(p);
  }
  await updateProfile();
});

setInterval(updateProfile, 30000);
