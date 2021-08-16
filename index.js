const discord = require("discord.js");
const config = require("./config.json");
const Database = require("lundb")
const db = new Database()
const client = new discord.Client()

client.on("ready", async () => {
  console.log("bot aktif")
  let botVoiceChannel = client.channels.cache.get(config.seskanalid);
  if (botVoiceChannel) botVoiceChannel.join()
  console.log(`Başarıyla Ses Kanalına Girildi!`)
});

//ceza fonksiyonu
function ceza(user, type) {
  let uye = client.guilds.cache.get(config.guildİd).members.cache.get(user)
  if (type === "jail") return uye.roles.cache.has(config.booster) ? uye.roles.set([config.booster, config.jailRolİd]) : uye.roles.set([config.jailRolİd])
  if (type === "ban") return uye.ban({ reason: "guard" })
}

//bot koruma
client.on("guildMemberAdd", async member => {
  let entry = await member.guild.fetchAuditLogs({ type: 'BOT_ADD' }).then(audit => audit.entries.first());
  if (!member.user.bot || entry.executor.id === client.user.id || config.whitelist.includes(entry.executor.id) || entry.executor.id === member.guild.owner.id) return
  ceza(entry.executor.id, "jail")
  ceza(member.id, "ban")
  client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Bot Guard").setDescription(`${entry.executor} tarafından **Sunucuya Bot Eklendi | ${member} ${member.id}** ve Kişi **Jaillendi**`).setFooter("lunex was around"))
});

//sunucu koruma
client.on("guildUpdate", async (oldGuild, newGuild) => {
  let entry = await newGuild.fetchAuditLogs({ type: 'GUILD_UPDATE' }).then(audit => audit.entries.first());
  if (entry.executor.id === client.user.id || config.whitelist.includes(entry.executor.id) || entry.executor.id === oldGuild.guild.owner.id) return
  if (oldGuild.premiumSubscriptionCount !== newGuild.premiumSubscriptionCount || oldGuild.premiumTier !== newGuild.premiumTier) return

  if (newGuild.name !== oldGuild.name) {
    newGuild.setName(oldGuild.name)
    ceza(entry.executor.id, "jail")
    return client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Sunucu Guard").setDescription(`${entry.executor} tarafından **Sunucu İsmi Güncellendi** ve Kişi **Jaillendi**`).setFooter("lunex was around"))
  }

  if (newGuild.iconURL({ dynamic: true, size: 2048 }) !== oldGuild.iconURL({ dynamic: true, size: 2048 })) {
    newGuild.setIcon(oldGuild.iconURL({ dynamic: true, size: 2048 }))
    ceza(entry.executor.id, "jail")
    return client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Sunucu Guard").setDescription(`${entry.executor} tarafından **Sunucu İkonu Güncellendi** ve Kişi **Jaillendi**`).setFooter("lunex was around"))
  }

  client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Sunucu Guard").setDescription(`${entry.executor} tarafından **Belirlenemeyen İşlem** ve Kişi **Jaillendi**`).setFooter("lunex was around"))
  ceza(entry.executor.id, "jail")
});

//kanal koruma
client.on("channelDelete", async function (channel) {
  let entry = await channel.guild.fetchAuditLogs({ type: 'CHANNEL_DELETE' }).then(audit => audit.entries.first())
  if (!entry | !entry.executor || entry.executor.id === client.user.id || config.whitelist.includes(entry.executor.id) || entry.executor.id === channel.guild.owner.id) return
  let positionChannel = channel.parentID;
  let position = positionChannel.position;
  channel.clone().then(kanal => {
    kanal.setPosition(position);
    client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Kanal Guard").setDescription(`${entry.executor} tarafından **Kanal Silindi | <#${channel.id}> ${channel.name}** ve Kişi **Jaillendi**`).setFooter("lunex was around"))
    ceza(entry.executor.id, "jail")
  });
});

//kanal koruma
client.on("channelCreate", async channel => {
  let entry = await channel.guild.fetchAuditLogs({ type: 'CHANNEL_CREATE' }).then(audit => audit.entries.first())
  if (entry.executor.id === client.user.id || config.whitelist.includes(entry.executor.id) || entry.executor.id === channel.guild.owner.id) return
  channel.delete()
  client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Kanal Guard").setDescription(`${entry.executor} tarafından **Kanal Açıldı | <#${channel.id}> ${channel.name}** ve Kişi **Jaillendi**`).setFooter("lunex was around"))
  ceza(entry.executor.id, "jail")
})

//kanal koruma
client.on("channelUpdate", async (oldChannel, newChannel) => {
  let entry = await newChannel.guild.fetchAuditLogs({ type: 'CHANNEL_UPDATE' }).then(audit => audit.entries.first());
  if (entry.executor.id === client.user.id || config.whitelist.includes(entry.executor.id) || entry.executor.id === oldChannel.guild.owner.id) return
  if (newChannel.type !== "category" && newChannel.parentID !== oldChannel.parentID) newChannel.setParent(oldChannel.parentID);

  if (newChannel.type === "category") {
    newChannel.edit({
      name: oldChannel.name,
    });
  } else if (newChannel.type === "text") {
    newChannel.edit({
      name: oldChannel.name,
      topic: oldChannel.topic,
      nsfw: oldChannel.nsfw,
      rateLimitPerUser: oldChannel.rateLimitPerUser
    });
  } else if (newChannel.type === "voice") {
    newChannel.edit({
      name: oldChannel.name,
      bitrate: oldChannel.bitrate,
      userLimit: oldChannel.userLimit,
    });
  };
  oldChannel.permissionOverwrites.forEach(perm => {
    let thisPermOverwrites = {};
    perm.allow.toArray().forEach(p => {
      thisPermOverwrites[p] = true;
    });
    perm.deny.toArray().forEach(p => {
      thisPermOverwrites[p] = false;
    });
    newChannel.createOverwrite(perm.id, thisPermOverwrites);
  });
  ceza(entry.executor.id, "jail")
  client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Kanal Guard").setDescription(`${entry.executor} tarafından **Kanal Güncellendi | <#${oldChannel.id}> ${oldChannel.name}** ve Kişi **Jaillendi**`).setFooter("lunex was around"))
});

//webhook koruma
client.on("webhookUpdate", async channel => {
  let entry = await channel.guild.fetchAuditLogs({ type: 'WEBHOOK_CREATE' }).then(audit => audit.entries.first())
  if (entry.executor.id === client.user.id || config.whitelist.includes(entry.executor.id) || entry.executor.id === channel.guild.owner.id) return
  const webhooklar = await channel.fetchWebhooks()
  await webhooklar.map(lunex => lunex.delete({ reason: "guard" }))
  ceza(entry.executor.id, "jail")
  client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Kanal Guard").setDescription(`${entry.executor} tarafından **Webhook Açıldı | <#${channel.id}> ${channel.name}** ve Kişi **Jaillendi**`).setFooter("lunex was around"))
})

//rol koruma
client.on("roleDelete", async role => {
  const entry = await role.guild.fetchAuditLogs({ type: "ROLE_DELETE" }).then(audit => audit.entries.first());
  if (role.deleted === false || entry.executor.id === client.user.id || config.whitelist.includes(entry.executor.id) || entry.executor.id === role.guild.owner.id) return
  role.guild.roles.create({
    data: {
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      permissions: role.permissions,
      mentionable: role.mentionable,
      position: role.position
    }, reason: `guard`
  })

  client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Rol Guard").setDescription(`${entry.executor} tarafından **Rol Silindi | ${role.name}**' ve Kişi **Jaillendi**`).setFooter("lunex was around"))
  ceza(entry.executor.id, "jail")
})

//rol koruma
client.on("roleCreate", async role => {
  const entry = await role.guild.fetchAuditLogs({ type: "ROLE_CREATE" }).then(audit => audit.entries.first());
  if (entry.executor.id == client.user.id || config.whitelist.includes(entry.executor.id) || entry.executor.id === role.guild.owner.id) return
  role.delete()
  ceza(entry.executor.id, "jail")
  client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Rol Guard").setDescription(`${entry.executor} tarafından **Rol açıldı** ve Kişi **Jaillendi**`).setFooter("lunex was around"))
});

//rol koruma
client.on("roleUpdate", async (oldRole, newRole) => {
  let entry = await newRole.guild.fetchAuditLogs({ type: 'ROLE_UPDATE' }).then(audit => audit.entries.first());
  if (entry.executor.id == client.user.id || config.whitelist.includes(entry.executor.id) || entry.executor.id === oldRole.guild.owner.id) return;

  newRole.edit({
    name: oldRole.name,
    color: oldRole.hexColor,
    hoist: oldRole.hoist,
    permissions: oldRole.permissions,
    mentionable: oldRole.mentionable
  });

  ceza(entry.executor.id, "jail");
  client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Rol Guard").setDescription(`${entry.executor} tarafından **Rol Güncellendi** ve Kişi **Jaillendi**`).setFooter("lunex was around"))
});

//emoji koruma
client.on('emojiCreate', async (emoji) => {
  let entry = await emoji.guild.fetchAuditLogs({ type: 'EMOJI_CREATE' }).then(audit => audit.entries.first())
  if (entry.executor.id === client.user.id || config.whitelist.includes(entry.executor.id) || emoji.guild.owner.id === entry.executor.id || !entry) return
  emoji.delete({ reason: "guard" })
  ceza(entry.executor.id, "jail")
  client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Emoji Guard").setDescription(`${entry.executor} tarafından **Emoji Oluşturuldu** ve Kişi **Jaillendi**`).setFooter("lunex was around"))
});

//emoji koruma
client.on('emojiUpdate', async (oldEmoji, newEmoji) => {
  let entry = await oldEmoji.guild.fetchAuditLogs({ type: 'EMOJI_UPDATE' }).then(audit => audit.entries.first());
  if (entry.executor.id === client.user.id || config.whitelist.includes(entry.executor.id) || oldEmoji.guild.owner.id === entry.executor.id || !entry) return
  await newEmoji.setName(oldEmoji.name);
  ceza(entry.executor.id)
  client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Emoji Guard").setDescription(`${entry.executor} tarafından **Emoji Güncellendi** ve Kişi **Jaillendi**`).setFooter("lunex was around"))
});

//emoji koruma
client.on("emojiDelete", async (emoji) => {
  const entry = await emoji.guild.fetchAuditLogs({ type: "EMOJI_DELETE" }).then(audit => audit.entries.first());
  if (entry.executor.id === client.user.id || config.whitelist.includes(entry.executor.id) || entry.executor.id === emoji.guild.owner.id) return
  await emoji.guild.emojis.create(`${emoji.url}`, `${emoji.name}`).catch(console.error);
  ceza(entry.executor.id, "jail")
  client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Emoji Guard").setDescription(`${entry.executor} tarafından **Emoji Silindi** ve Kişi **Jaillendi**`).setFooter("lunex was around"))
});

//fake hesap
client.on("guildMemberAdd", async member => {
  var moment = require("moment")
  require("moment-duration-format")
  moment.locale("tr")

  var x = moment(member.user.createdAt).add(14, 'days').fromNow()
  x = x.replace("birkaç saniye önce", " ")
  if (!x.includes("önce") || x.includes("sonra") || x == " ") {

    const memberfake = new discord.MessageEmbed().setColor("RED").setTitle("Fake Hesap...").setDescription("Hesabınız 14 günden daha kısa bir süre önce açıldığı için askıya alındınız, yetkililere haber vererek hesabı cezayı kaldırttırabilirsiniz!").setFooter("lunex was around")
    member.user.send(memberfake);
    const log = new discord.MessageEmbed().setColor("RED").setTitle("Fake Hesap Sistemi").setDescription(`Bir Kullanıcı Fake Hesap Sistemine Takıldı Ve Cezalandırıldı | <@${member.id}>`).setFooter("lunex was around")

    client.channels.cache.get(config.fakelogİd).send(log)
    member.roles.add(config.fakeRolİd)
    member.roles.remove(config.üyerol)
  }
});

//reklam engel
client.on('message', async message => {

  let reklamlar = ["discord.gg", "discordgg", ".gg"]
  if (reklamlar.some(reklam => message.content.toLowerCase().includes(reklam))) {

    if (config.whitelist.includes(message.author.id)) return;

    message.delete()

    const lunex = new discord.MessageEmbed().setColor("RED").setTitle("Heyyy!").setDescription(`<@${message.author.id}> Bu Sunucuda Reklam Yasak!`).setFooter("lunex was around")
    message.channel.send(lunex)
  }
});

//reklam engel
client.on("messageUpdate", async (oldMsg, newMsg) => {

  let reklamlar = ["discord.gg", "discordgg", ".gg"]

  if (reklamlar.some(reklam => newMsg.content.toLowerCase().includes(reklam))) {

    if (config.whitelist.includes(oldMsg.author.id)) return;

    newMsg.delete()

    const lunex = new discord.MessageEmbed().setColor("RED").setTitle("Heyyy!").setDescription(`<@${oldMsg.author.id}> Bu Sunucuda Reklam Yasak!`).setFooter("lunex was around")
    oldMsg.channel.send(lunex)
  }
});

//etiket engel
client.on("message", message => {
  if (message.mentions.users.size > "3" && message.mentions.users.size < "5") {
    if (config.whitelist.includes(message.author.id)) return;
    message.delete()
    message.channel.send("bu kadar etiket atamazsın!")
    client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Etiket Guard").setDescription(`${message.author} tarafından **3**'ten fazla etiket atıldı ve kişinin **Mesajı Silindi**\nAttığı etiket sayısı: **${message.mentions.users.size}**`).setFooter("lunex was around"))
  }

  if (message.mentions.users.size > "5" && message.mentions.users.size < "7") {
    if (config.whitelist.includes(message.author.id)) return;
    ceza(message.author.id, "jail")
    message.channel.send(`${message.author} fazla etiketten jaillendi`)
    client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Etiket Guard").setDescription(`${message.author} tarafından **5**'den fazla etiket atıldı ve Kişi **Jaillendi**\nAttığı etiket sayısı: **${message.mentions.users.size}**`).setFooter("lunex was around"))
  }

  if (message.mentions.users.size > "7") {
    if (config.whitelist.includes(message.author.id)) return;
    ceza(message.author.id, "ban")
    message.channel.send(`${message.author} fazla etiketten banlandı`)
    client.channels.cache.get(config.antiraidlog).send(new discord.MessageEmbed().setColor("RED").setTitle("Etiket Guard").setDescription(`${message.author} tarafından **7**'den fazla etiket atıldı ve Kişi **Banlandı**\nAttığı etiket sayısı: **${message.mentions.users.size}**`).setFooter("lunex was around"))
  }
})

client.on("message", message => {
  if (message.content.length >= 500) {
    if (message.author.bot || config.whitelist.includes(message.author.id) || message.author.id === message.guild.owner.id) return
    message.delete()
  }
})

client.on('message', message => {

  const maxTime = db.fetch(`max.${message.author.id}`);
  const time = db.fetch(`time.${message.author.id}`);
  db.add(`mesaj.${message.author.id}`, 1)

  if (time) {
    const sayı = db.fetch(`mesaj.${message.author.id}`);
    if (Date.now() < maxTime) {
      if (config.whitelist.includes(message.author.id) || message.author.id === client.user.id || message.author.bot || message.author.id === message.guild.owner.id) return
      message.delete()
    }
  }

  else {

    db.set(`time.${message.author.id}`, 'ok');
    db.set(`max.${message.author.id}`, Date.now() + 3000);
    setTimeout(() => {
      db.delete(`mesaj.${message.author.id}`);
      db.delete(`time.${message.author.id}`);
    }, 3000)
  }

});

client.login(config.token)