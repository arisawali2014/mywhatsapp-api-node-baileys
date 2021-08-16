//
// Configuração dos módulos
const os = require("os");
const fs = require('fs-extra');
const qr = require("qr-image");
const {
  forEach
} = require('p-iteration');
const axios = require('axios');
const {
  WAConnection,
  MessageType,
  Presence,
  MessageOptions,
  Mimetype,
  WALocationMessage,
  WA_MESSAGE_STUB_TYPES,
  ReconnectMode,
  ProxyAgent,
  waChatKey,
} = require('@adiwajshing/baileys');
const newinstance = require('./newinstance');
const mkEvents = require('./events');
const patchpanel = new Map();
const conn = require('./config/dbConnection').promise();
const serverConfig = require("./config/server.config.json");
const io = require("socket.io-client"),
  ioClient = io.connect("http://" + serverConfig.host + ":" + serverConfig.port);
const {
  cache
} = require('sharp');
const con = require("./config/dbConnection");
//
// ------------------------------------------------------------------------------------------------------- //
//
async function DataHora() {
  //
  let date_ob = new Date();

  // Data atual
  // Ajuste 0 antes da data de um dígito
  let date = ("0" + date_ob.getDate()).slice(-2);

  // Mês atual
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

  // Ano atual
  let year = date_ob.getFullYear();

  // Hora atual
  let hours = date_ob.getHours();

  // Minuto atual
  let minutes = date_ob.getMinutes();

  // Segundo atual
  let seconds = date_ob.getSeconds();

  // Imprime a data no formato AAAA-MM-DD
  console.log(year + "-" + month + "-" + date);

  // Imprime a data no formato DD/MM/YYYY
  console.log(date + "/" + month + "/" + year);

  // Imprime data e hora no formato AAAA-MM-DD HH:MM:SS
  console.log(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);

  // Imprime data e hora no formato DD/MM/YYYY HH:MM:SS
  console.log(date + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds);

  // Imprime a hora no formato HH:MM:SS
  console.log(hours + ":" + minutes + ":" + seconds);
  //
  return date + "/" + month + "/" + year + " " + hours + ":" + minutes + ":" + seconds;
}
//
async function saudacao() {
  //
  var data = new Date();
  var hr = data.getHours();
  //
  if (hr >= 0 && hr < 12) {
    var saudacao = "Bom dia";
    //
  } else if (hr >= 12 && hr < 18) {
    var saudacao = "Boa tarde";
    //
  } else if (hr >= 18 && hr < 23) {
    var saudacao = "Boa noite";
    //
  } else {
    var saudacao = "---";
    //
  }
  return saudacao;
}
//
async function osplatform() {
  //
  var opsys = process.platform;
  if (opsys == "darwin") {
    opsys = "MacOS";
  } else if (opsys == "win32" || opsys == "win64") {
    opsys = "Windows";
  } else if (opsys == "linux") {
    opsys = "Linux";
  }
  console.log("- Sistema operacional", opsys) // I don't know what linux is.
  //console.log("-", os.type());
  //console.log("-", os.release());
  //console.log("-", os.platform());
  //
  return opsys;
}
//
// ------------------------------------------------------------------------------------------------------- //
//
async function updateStateDb(state, status, session_venom) {
  //
  const sql = "UPDATE tokens SET state=?, status=? WHERE token=?";
  const values = [state, status, session_venom];
  const resUpdate = await conn.execute(sql, values);
  if (resUpdate) {
    console.log('- Status atualizado');
  } else {
    console.log('- Status não atualizado');
  }
  //
}
//
// ------------------------------------------------------------------------------------------------------- //
//
async function deletaToken(filePath) {
  //
  const cacheExists = await fs.pathExists(filePath);
  console.log('- O arquivo é: ' + cacheExists);
  console.log('- Path: ' + filePath);
  if (cacheExists) {
    fs.remove(filePath);
    console.log('- O arquivo removido: ' + cacheExists);
  }
}
//
module.exports = class Sessions {
  //
  static async getStatusApi(sessionName, options = []) {
    Sessions.options = Sessions.options || options;
    Sessions.sessions = Sessions.sessions || [];

    var session = Sessions.getSession(sessionName);
    return session;
  } //getStatus
  //
  static async ApiStatus(SessionName) {
    console.log("- Status");
    var session = Sessions.getSession(SessionName);

    if (session) { //só adiciona se não existir
      if (session.state == "CONNECTED") {
        return {
          result: "info",
          SessionName: SessionName,
          state: session.state,
          status: session.status,
          qrcode: session.qrcode,
          message: "Sistema iniciado e disponivel para uso"
        };
      } else if (session.state == "STARTING") {
        return {
          result: "info",
          SessionName: SessionName,
          state: session.state,
          status: session.status,
          qrcode: session.qrcode,
          message: "Sistema iniciando e indisponivel para uso"
        };
      } else if (session.state == "QRCODE") {
        return {
          result: "warning",
          SessionName: SessionName,
          state: session.state,
          status: session.status,
          qrcode: session.qrcode,
          message: "Sistema aguardando leitura do QR-Code"
        };
      } else {
        switch (session.status) {
          case 'isLogged':
            return {
              result: "success",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "Sistema iniciado e disponivel para uso"
            };
            break;
          case 'notLogged':
            return {
              result: "error",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "Sistema indisponivel para uso"
            };
            break;
          case 'browserClose':
            return {
              result: "info",
                state: session.state,
                SessionName: SessionName,
                status: session.status,
                qrcode: session.qrcode,
                message: "Navegador interno fechado"
            };
            break;
          case 'qrReadSuccess':
            return {
              result: "success",
                state: session.state,
                SessionName: SessionName,
                status: session.status,
                qrcode: session.qrcode,
                message: "Verificação do QR-Code feita com sucesso"
            };
            break;
          case 'qrReadFail':
            return {
              result: "warning",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "Falha na verificação do QR-Code"
            };
            break;
          case 'qrRead':
            return {
              result: "warning",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "Sistema aguardando leitura do QR-Code"
            };
            break;
          case 'autocloseCalled':
            return {
              result: "info",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "Navegador interno fechado"
            };
            break;
          case 'desconnectedMobile':
            return {
              result: "info",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "Dispositivo desconectado"
            };
            break;
          case 'deleteToken':
            return {
              result: "info",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "Token de sessão removido"
            };
            break;
          case 'chatsAvailable':
            return {
              result: "success",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "Sistema iniciado e disponivel para uso"
            };
            break;
          case 'deviceNotConnected':
            return {
              result: "info",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "Dispositivo desconectado"
            };
            break;
          case 'serverWssNotConnected':
            return {
              result: "info",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "O endereço wss não foi encontrado"
            };
            break;
          case 'noOpenBrowser':
            return {
              result: "error",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "Não foi encontrado o navegador ou falta algum comando no args"
            };
            break;
          case 'serverClose':
            return {
              result: "info",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "O cliente se desconectou do wss"
            };
            break;
          case 'OPENING':
            return {
              result: "warning",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "'Sistema iniciando e indisponivel para uso'"
            };
            break;
          case 'CONFLICT':
            return {
              result: "info",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "Dispositivo conectado em outra sessão, reconectando"
            };
            break;
          case 'UNPAIRED':
          case 'UNLAUNCHED':
          case 'UNPAIRED_IDLE':
            return {
              result: "warning",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "Dispositivo desconectado"
            };
            break;
          case 'DISCONNECTED':
            return {
              result: "info",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "Dispositivo desconectado"
            };
            break;
          case 'SYNCING':
            return {
              result: "warning",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "Dispositivo sincronizando"
            };
            break;
          case 'CLOSED':
            return {
              result: "info",
                SessionName: SessionName,
                state: session.state,
                status: session.status,
                qrcode: session.qrcode,
                message: "O cliente fechou a sessão ativa"
            };
            break;
          default:
            //
            return {
              result: 'error',
                SessionName: SessionName,
                state: 'NOTFOUND',
                status: 'notLogged',
                qrcode: null,
                message: 'Sistema Off-line'
            };
            //
        }
      }
    } else {
      return {
        result: 'error',
        SessionName: SessionName,
        state: 'NOTFOUND',
        status: 'notLogged',
        qrcode: null,
        message: 'Sistema Off-line'
      };
    }
  } //status
  //
  // ------------------------------------------------------------------------------------------------------- //
  //
  static async Start(SessionName, options = []) {
    Sessions.options = Sessions.options || options; //start object
    Sessions.sessions = Sessions.sessions || []; //start array

    var session = Sessions.getSession(SessionName);

    if (session == false) {
      //create new session
      //
      console.log('- Nome da sessão:', session.name);
      console.log('- State do sistema:', session.state);
      console.log('- Status da sessão:', session.status);
      //
      session = await Sessions.addSesssion(SessionName);
    } else if (["CLOSED"].includes(session.state)) {
      //restart session
      console.log("- State: CLOSED");
      session.state = "CLOSED";
      session.status = "notLogged";
      session.qrcode = null;
      session.qrcodedata = null;
      session.attempts = 0;
      session.message = "Sistema iniciando e indisponivel para uso";
      session.prossesid = null;
      //
      console.log('- Nome da sessão:', session.name);
      console.log('- State do sistema:', session.state);
      console.log('- Status da sessão:', session.status);
      //
      session.client = Sessions.initSession(SessionName);
      Sessions.setup(SessionName);
    } else if (["CONFLICT", "UNPAIRED", "UNLAUNCHED", "UNPAIRED_IDLE"].includes(session.state)) {
      session.state = "CLOSED";
      session.status = 'notLogged';
      session.qrcode = null;
      session.qrcodedata = null;
      session.message = 'Sistema desconectado';
      //
      console.log('- Nome da sessão:', session.name);
      console.log('- State do sistema:', session.state);
      console.log('- Status da sessão:', session.status);
      //
      session.client.then(client => {
        console.log("- Client UseHere");
        client.useHere();
      });
      session.client = Sessions.initSession(SessionName);
    } else if (["DISCONNECTED"].includes(session.state)) {
      //restart session
      session.state = "CLOSE";
      session.status = "notLogged";
      session.qrcode = null;
      session.qrcodedata = null;
      session.attempts = 0;
      session.message = 'Sistema desconectado';
      session.prossesid = null;
      //
      console.log('- Nome da sessão:', session.name);
      console.log('- State do sistema:', session.state);
      console.log('- Status da sessão:', session.status);
      //
      session.client = Sessions.initSession(SessionName);
      Sessions.setup(SessionName);
    } else {
      console.log('- Nome da sessão:', session.name);
      console.log('- State do sistema:', session.state);
      console.log('- Status da sessão:', session.status);
    }
    //
    await updateStateDb(session.state, session.status, SessionName);
    //
    return session;
  } //start
  //
  // ------------------------------------------------------------------------------------------------------- //
  //
  static async addSesssion(SessionName) {
    console.log("- Adicionando sessão");
    var newSession = {
      name: SessionName,
      process: null,
      qrcode: null,
      qrcodedata: null,
      client: false,
      result: null,
      tokenPatch: null,
      state: 'STARTING',
      status: 'notLogged',
      message: 'Sistema iniciando e indisponivel para uso',
      attempts: 0,
      browserSessionToken: null
    }
    Sessions.sessions.push(newSession);
    console.log("- Nova sessão: " + newSession.state);

    //setup session
    newSession.client = Sessions.initSession(SessionName);
    Sessions.setup(SessionName);

    return newSession;
  } //addSession
  //
  // ------------------------------------------------------------------------------------------------//
  //
  static getSession(SessionName) {
    var foundSession = false;
    if (Sessions.sessions)
      Sessions.sessions.forEach(session => {
        if (SessionName == session.name) {
          foundSession = session;
        }
      });
    return foundSession;
  } //getSession
  //
  // ------------------------------------------------------------------------------------------------//
  //
  static getSessions() {
    if (Sessions.sessions) {
      return Sessions.sessions;
    } else {
      return [];
    }
  } //getSessions
  //
  // ------------------------------------------------------------------------------------------------------- //
  //
  static async initSession(SessionName) {
    console.log("- Iniciando sessão");
    var session = Sessions.getSession(SessionName);
    session.browserSessionToken = null;
    //
    /*
      ╔═╗┌─┐┌┬┐┬┌─┐┌┐┌┌─┐┬    ╔═╗┬─┐┌─┐┌─┐┌┬┐┌─┐  ╔═╗┌─┐┬─┐┌─┐┌┬┐┌─┐┌┬┐┌─┐┬─┐┌─┐
      ║ ║├─┘ │ ││ ││││├─┤│    ║  ├┬┘├┤ ├─┤ │ ├┤   ╠═╝├─┤├┬┘├─┤│││├┤  │ ├┤ ├┬┘└─┐
      ╚═╝┴   ┴ ┴└─┘┘└┘┴ ┴┴─┘  ╚═╝┴└─└─┘┴ ┴ ┴ └─┘  ╩  ┴ ┴┴└─┴ ┴┴ ┴└─┘ ┴ └─┘┴└─└─┘
   */
    //
    const osnow = await osplatform();
    //
    if (osnow == 'linux' || osnow == 'Linux') {
      console.log("- Sistema operacional:", osnow);
      var folderToken = serverConfig.tokenspatch_linux;
      session.tokenPatch = folderToken;
    } else if (osnow == 'win32' || osnow == 'win64' || osnow == 'Windows') {
      console.log("- Sistema operacional:", osnow);
      var folderToken = serverConfig.tokenspatch_win;
      session.tokenPatch = folderToken;
    } else {
      var folderToken = './tokens';
      session.tokenPatch = folderToken;
    }
    //
    console.log("- Saudação:", await saudacao());
    //
    console.log('- Nome da sessão:', session.name);
    //
    session.state = "QRCODE";
    session.status = "qrRead";
    session.message = 'Sistema iniciando e indisponivel para uso';
    //-------------------------------------------------------------------------------------------------------------------------------------//
    const client = new WAConnection();
    client.autoReconnect = true; // auto reconnect on disconnect
    client.logUnhandledMessages = false;
    client.connectOptions = {
      regenerateQRIntervalMs: 15000,
      /** fails the connection if no data is received for X seconds */
      maxIdleTimeMs: 60000,
      /** maximum attempts to connect */
      maxRetries: Infinity,
      /** max time for the phone to respond to a connectivity test */
      /** should the chats be waited for;
       * should generally keep this as true, unless you only care about sending & receiving new messages
       * & don't care about chat history
       * */
      waitForChats: true,
      /** if set to true, the connect only waits for the last message of the chat
       * setting to false, generally yields a faster connect
       */
      waitOnlyForLastMessage: false,
      /** max time for the phone to respond to a connectivity test */
      phoneResponseTime: 15000,
      /** minimum time between new connections */
      connectCooldownMs: 4000,
      /** agent used for WS connections (could be a proxy agent) */
      agent: undefined,
      /** agent used for fetch requests -- uploading/downloading media */
      fetchAgent: undefined,
      /** always uses takeover for connecting */
      alwaysUseTakeover: true,
      /** log QR to terminal */
      logQR: true
    };
    client.browserDescription = ['ConnectZap', 'Chrome', '87']
    fs.existsSync(`${session.tokenPatch}/${session.name}.data.json`) && client.loadAuthInfo(`${session.tokenPatch}/${session.name}.data.json`);
    client.autoReconnect = ReconnectMode.onConnectionLost; // only automatically reconnect when the connection breaks
    client.logger.level = 'debug'; // set to 'debug' to see what kind of stuff you can implement
    // attempt to reconnect at most 10 times in a row
    client.connectOptions.maxRetries = 10;
    client.chatOrderingKey = waChatKey(true); // order chats such that pinned chats are on top
    //
    let lastqr = null;
    let attempts = 0;
    //
    /*
    client.on("qr", (qr_data) => {
      let qr_img_buffer = qr.imageSync(qr_data);
      lastqr = qr;
      attempts++;
      //
      console.log("- State:", client.state);
      //
      console.log('- Número de tentativas de ler o qr-code:', attempts);
      session.attempts = attempts;
      //
      console.log("- Captura do QR-Code");
      //console.log(base64Qrimg);
      session.qrcodedata = qr_img_buffer;
      //
    });
		*/
    /*
    conn.on('qr', (qr) => {
      lastqr = qr;
      attempts++;
      //
      console.log('- Número de tentativas de ler o qr-code:', attempts);
      session.attempts = attempts;
      //
      console.log("- Captura do QR-Code");
      //console.log(base64Qrimg);
      session.qrcode = qr;
      //
    });
		*/
    //
    /*
        conn.on('open', () => {
          // save credentials whenever updated
          console.log(`- Credentials updated!`)
          const authInfo = conn.base64EncodedAuthInfo() // get all the auth info we need to restore this session
          fs.writeFileSync(`${session.tokenPatch}/${session.name}.data.json`, JSON.stringify(authInfo, null, '\t')) // save this info to a file
        });
        //
        client.conn.on('chats-received', ({
          hasNewChats
        }) => {
          console.log(`you have ${client.chats.length} chats, new chats available: ${hasNewChats}`);
        });
        //
        client.conn.on('contacts-received', () => {
          console.log(`you have ${Object.keys(client.contacts).length} contacts`);
        });
        //
        client.conn.on('initial-data-received', () => {
          console.log('received all initial messages');
        });
        //
        // example of custom functionality for tracking battery
        client.conn.on('CB:action,,battery', json => {
          const batteryLevelStr = json[2][0][1].value
          const batterylevel = parseInt(batteryLevelStr)
          console.log('battery level: ' + batterylevel)
        });
        //
        client.conn.on('close', ({
          reason,
          isReconnecting
        }) => (
          console.log('oh no got disconnected: ' + reason + ', reconnecting: ' + isReconnecting)
        ));
        //
        const client = await conn.connect().catch((err) => {
          console.log(err);
        });
        //
    */
    //

    return client;
  } //initSession
  //
  // ------------------------------------------------------------------------------------------------//
  //
  /*
    ╔═╗┌─┐┌┬┐┌┬┐┬┌┐┌┌─┐  ┌─┐┌┬┐┌─┐┬─┐┌┬┐┌─┐┌┬┐
    ║ ╦├┤  │  │ │││││ ┬  └─┐ │ ├─┤├┬┘ │ ├┤  ││
    ╚═╝└─┘ ┴  ┴ ┴┘└┘└─┘  └─┘ ┴ ┴ ┴┴└─ ┴ └─┘─┴┘
  */
  //
  static async setup(SessionName) {
    console.log("- Sinstema iniciando");
    var session = Sessions.getSession(SessionName);
    await session.client.then(async (client) => {
      //

      const sharedstate = {}
      sharedstate.client = client

      const events = mkEvents({
        SessionName,
        sharedstate
      });
      //
      client.on('blocklist-update', events.blocklistUpdate);
      client.on('chat-new', events.chatNew);
      client.on('chats-received', events.chatsReceived);
      client.on('chat-update', events.chatUpdate);
      client.on('close', events.close);
      client.on('connecting', events.connecting);
      client.on('connection-phone-change', events.connectionPhoneChange);
      client.on('connection-validated', events.connectionValidated);
      client.on('contacts-received', events.contactsReceived);
      client.on('contact-update', events.contactUpdate);
      client.on('credentials-updated', events.credentialsUpdated);
      client.on('group-participants-update', events.groupParticipantsUpdate);
      client.on('group-update', events.groupUpdate);
      client.on('message-status-update', events.messageStatusUpdate);
      client.on('open', events.open);
      client.on('qr', events.qr);
      /*
    	client.on("qr", (qr_data) => {
      let qr_img_buffer = qr.imageSync(qr_data);
      lastqr = qr;
      attempts++;
      //
      console.log("- State:", client.state);
      //
      console.log('- Número de tentativas de ler o qr-code:', attempts);
      session.attempts = attempts;
      //
      console.log("- Captura do QR-Code");
      //console.log(base64Qrimg);
      session.qrcodedata = qr_data;
      //
    });
		*/
      /*
    	conn.on('qr', (qr) => {
      lastqr = qr;
      attempts++;
      //
      console.log('- Número de tentativas de ler o qr-code:', attempts);
      session.attempts = attempts;
      //
      console.log("- Captura do QR-Code");
      //console.log(base64Qrimg);
      session.qrcode = qr;
      //
    });
		*/
      client.on('received-pong', events.receivedPong);
      client.on('ws-close', events.wsClose);

      patchpanel.set(SessionName, {
        client,
        sharedstate
      });
      //

      //
      await client.connect().then((user) => {
        // credentials are updated on every connect
        const authInfo = client.base64EncodedAuthInfo(); // get all the auth info we need to restore this session
        session.browserSessionToken = JSON.stringify(authInfo, null, '\t');
        fs.writeFileSync(`${session.tokenPatch}/${session.name}.data.json`, JSON.stringify(authInfo, null, '\t')) // save this info to a file
        //
      }).catch((err) => {
        console.log(`- Encountered error: ${err}`);
      });
      //
    });
  } //setup
  //
  // ------------------------------------------------------------------------------------------------//
  //
  static async closeSession(SessionName) {
    console.log("- Fechando sessão");
    var session = Sessions.getSession(SessionName);
    var closeSession = await session.client.then(async client => {
      try {
        const strClosed = await client.close();
        if (strClosed) {
          //
          session.state = "CLOSED";
          session.status = 'CLOSED';
          session.client = false;
          session.qrcode = null;
          console.log("- Sessão fechada");
          //
          var returnClosed = {
            result: "success",
            state: session.state,
            status: session.status,
            qrcode: session.qrcode,
            message: "Erro ao fechar sessão"
          };
          //
        } else {
          //
          var returnClosed = {
            result: "error",
            state: session.state,
            status: session.status,
            qrcode: session.qrcode,
            message: "Erro ao fechar sessão"
          };
          //
        }
        return returnClosed;
        //
      } catch (error) {
        console.log("- Erro ao fechar sessão:", error.message);
        //
        return {
          result: "error",
          state: session.state,
          status: session.status,
          qrcode: session.qrcode,
          message: "Erro ao fechar sessão"
        };
        //
      }
    });
    //
    await updateStateDb(session.state, session.status, SessionName);
    //
    return closeSession;
  } //closeSession
  //
  // ------------------------------------------------------------------------------------------------//
  //
  static async logoutSession(SessionName) {
    console.log("- Fechando sessão");
    var session = Sessions.getSession(SessionName);
    var LogoutSession = await session.client.then(async client => {
      try {
        const strLogout = await client.logout();
        if (strLogout) {
          //
          const strClosed = await client.close();
          //
          session.state = "DISCONNECTED";
          session.status = "DISCONNECTED";
          session.client = false;
          session.qrcode = null;
          console.log("- Sessão desconetada");
          //
          var returnLogout = {
            result: "success",
            state: session.state,
            status: session.status,
            qrcode: session.qrcode,
            message: "Sessão desconetada"
          };
          //
        } else {
          //
          var returnLogout = {
            result: "error",
            state: session.state,
            status: session.status,
            message: "Erro ao desconetar sessão"
          };
          //
        }
        //
        await deletaToken(session.tokenPatch + "/" + SessionName + ".data.json");
        //
        await updateStateDb(session.state, session.status, SessionName);
        //
        return returnLogout;
        //
      } catch (error) {
        console.log("- Erro ao desconetar sessão:", error.message);
        //
        return {
          result: "error",
          state: session.state,
          status: session.status,
          message: "Erro ao desconetar sessão"
        };
        //
      }
    });
    //
    await updateStateDb(session.state, session.status, SessionName);
    //
    return LogoutSession;
  } //LogoutSession
  //
  // ------------------------------------------------------------------------------------------------------- //
  //
  /*
  ╔╗ ┌─┐┌─┐┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐  ┬ ┬┌─┐┌─┐┌─┐┌─┐
  ╠╩╗├─┤└─┐││    ╠╣ │ │││││   │ ││ ││││└─┐  │ │└─┐├─┤│ ┬├┤ 
  ╚═╝┴ ┴└─┘┴└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘  └─┘└─┘┴ ┴└─┘└─┘
  */
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Enviar Contato
  static async sendContactVcard(
    SessionName,
    number,
    contact,
    namecontact
  ) {
    console.log("- Enviando contato.");
    //
    var session = Sessions.getSession(SessionName);
    var sendResult = await session.client.then(async client => {
      // Send contact
      return await client.sendContactVcard(
          number,
          contact,
          namecontact)
        .then((result) => {
          //console.log('Result: ', result); //return object success
          //
          return {
            "erro": false,
            "status": 200,
            "number": number,
            "canReceiveMessage": true,
            "text": "success",
            "message": "Contato enviado com sucesso."
          };
          //
        })
        .catch((erro) => {
          //console.error('Error when sending: ', erro); //return object error
          //
          return {
            "erro": true,
            "status": 404,
            "number": number,
            "canReceiveMessage": false,
            "text": erro.text,
            "message": "Erro ao enviar contato"
          };
          //
        });
    });
    return sendResult;
  } //sendContactVcard
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Enviar Lista Contato
  static async sendContactVcardList(
    SessionName,
    number,
    contactlistValid,
    contactlistInvalid

  ) {
    console.log("- Enviando lista de contato.");
    var session = Sessions.getSession(SessionName);
    var sendResult = await session.client.then(async client => {
      // Send contact
      return await client.sendContactVcardList(
          number,
          contactlistValid,
          contactlistInvalid
        ).then((result) => {
          //console.log('Result: ', result); //return object success
          //
          return {
            "erro": false,
            "status": 200,
            "canReceiveMessage": true,
            "contactlistValid": contactlistValid,
            "contactlistInvalid": contactlistInvalid,
            "text": "success",
            "message": "Lista de contatos validos enviada com sucesso."
          };
          //
        })
        .catch((erro) => {
          //console.error('Error when sending: ', erro); //return object error
          //
          return {
            "erro": true,
            "status": 404,
            "canReceiveMessage": false,
            "contactlistValid": contactlistValid,
            "contactlistInvalid": contactlistInvalid,
            "text": erro.text,
            "message": "Erro ao enviar lista de contatos validos"
          };
          //
        });
    });
    return sendResult;
  } //sendContactVcardList
  //
  // ------------------------------------------------------------------------------------------------//
  //
  //Enviar Texto
  static async sendText(
    SessionName,
    number,
    msg
  ) {
    console.log("- Enviando menssagem de texto.");
    var session = Sessions.getSession(SessionName);
    var sendResult = await session.client.then(async client => {
      // Send basic text
      return await client.sendText(
        number,
        msg
      ).then((result) => {
        //console.log("Result: ", result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "number": number,
          "canReceiveMessage": true,
          "message": "Menssagem enviada com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error("Error when sending: ", erro); //return object error
        //return { result: 'error', state: session.state, message: "Erro ao enviar menssagem" };
        //return (erro);
        //
        return {
          "erro": true,
          "status": 404,
          "number": number,
          "canReceiveMessage": false,
          "message": "Erro ao enviar menssagem"
        };
        //
      });
    });
    return sendResult;
  } //sendText
  //
  // ------------------------------------------------------------------------------------------------//
  //
  //Enviar localização
  static async sendLocation(
    SessionName,
    number,
    lat,
    long,
    local
  ) {
    console.log("- Enviando localização.");
    var session = Sessions.getSession(SessionName);
    var sendResult = await session.client.then(async client => {
      // Send basic text
      return await client.sendLocation(
        number,
        lat,
        long,
        local
      ).then((result) => {
        //console.log("Result: ", result); //return object success
        //return { result: "success", state: session.state, message: "Sucesso ao enviar menssagem" };
        //return (result);
        //
        return {
          "erro": false,
          "status": 200,
          "number": number,
          "canReceiveMessage": true,
          "text": "success",
          "message": "Localização enviada com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error("Error when sending: ", erro); //return object error
        //return { result: 'error', state: session.state, message: "Erro ao enviar menssagem" };
        //return (erro);
        //
        return {
          "erro": true,
          "status": 404,
          "number": number,
          "canReceiveMessage": false,
          "text": erro.text,
          "message": "Erro ao enviar localização."
        };
        //
      });
    });
    return sendResult;
  } //sendLocation
  //
  // ------------------------------------------------------------------------------------------------//
  //
  //Enviar links com preview
  static async sendLinkPreview(
    SessionName,
    number,
    link,
    detail
  ) {
    console.log("- Enviando link.");
    var session = Sessions.getSession(SessionName);
    var sendResult = await session.client.then(async client => {
      // Send basic text
      return await client.sendLinkPreview(
        number,
        link,
        detail
      ).then((result) => {
        //console.log("Result: ", result); //return object success
        //return { result: "success", state: session.state, message: "Sucesso ao enviar menssagem" };
        //return (result);
        //
        return {
          "erro": false,
          "status": 200,
          "number": number,
          "canReceiveMessage": true,
          "text": "success",
          "message": "Link enviada com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error("Error when sending: ", erro); //return object error
        //return { result: 'error', state: session.state, message: "Erro ao enviar menssagem" };
        //return (erro);
        //
        return {
          "erro": true,
          "status": 404,
          "number": number,
          "canReceiveMessage": false,
          "text": erro.text,
          "message": "Erro ao enviar link."
        };
        //
      });
    });
    return sendResult;
  } //sendLinkPreview
  //
  // ------------------------------------------------------------------------------------------------//
  //
  //Enviar Imagem
  static async sendImage(
    SessionName,
    number,
    filePath,
    fileName,
    caption
  ) {
    console.log("- Enviando menssagem com imagem.");
    var session = Sessions.getSession(SessionName);
    var resultsendImage = await session.client.then(async (client) => {
      return await client.sendImage(
        number,
        filePath,
        fileName,
        caption
      ).then((result) => {
        //console.log('Result: ', result); //return object success
        //return (result);
        //
        return {
          "erro": false,
          "status": 200,
          "number": number,
          "canReceiveMessage": true,
          "text": "success",
          "message": "Menssagem enviada com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //return (erro);
        //
        return {
          "erro": true,
          "status": 404,
          "number": number,
          "canReceiveMessage": false,
          "text": erro.text,
          "message": "Erro ao enviar menssagem"
        };
        //
      });
    });
    return resultsendImage;
  } //sendImage
  //
  // ------------------------------------------------------------------------------------------------//
  //
  //Enviar arquivo
  static async sendFile(
    SessionName,
    number,
    filePath,
    originalname,
    caption
  ) {
    console.log("- Enviando arquivo.");
    var session = Sessions.getSession(SessionName);
    var resultsendImage = await session.client.then(async (client) => {
      return await client.sendFile(
        number,
        filePath,
        originalname,
        caption
      ).then((result) => {
        //console.log('Result: ', result); //return object success
        //return (result);
        //
        return {
          "erro": false,
          "status": 200,
          "number": number,
          "canReceiveMessage": true,
          "text": "success",
          "message": "Arquivo enviado com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //return (erro);
        //
        return {
          "erro": true,
          "status": 404,
          "number": number,
          "canReceiveMessage": false,
          "text": erro.text,
          "message": "Erro ao enviar arquivo"
        };
        //
      });
    });
    return resultsendImage;
  } //sendFile
  //
  // ------------------------------------------------------------------------------------------------//
  //
  //Enviar Arquivo em Base64
  static async sendFileFromBase64(
    SessionName,
    number,
    base64Data,
    mimetype,
    originalname,
    caption
  ) {
    console.log("- Enviando arquivo em Base64Data");
    var session = Sessions.getSession(SessionName);
    var resultSendFile = await session.client.then(async (client) => {
      return await client.sendFileFromBase64(
        number,
        "data:" + mimetype + ";base64," + base64Data,
        originalname,
        caption
      ).then((result) => {
        //console.log('Result: ', result); //return object success
        //return (result);
        //
        return {
          "erro": false,
          "status": 200,
          "number": number,
          "canReceiveMessage": true,
          "text": "success",
          "message": "Arquivo enviada com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //return (erro);
        //
        return {
          "erro": true,
          "status": 404,
          "number": number,
          "canReceiveMessage": false,
          "text": erro.text,
          "message": "Erro ao enviar arquivo"
        };
        //
      });
    });
    //
    return resultSendFile;
  } //sendFileFromBase64
  //
  // ------------------------------------------------------------------------------------------------//
  //
  //Enviar imagem em gif
  static async sendImageAsStickerGif(
    SessionName,
    number,
    filePath
  ) {
    console.log("- Enviando gif.");
    var session = Sessions.getSession(SessionName);
    var resultsendImage = await session.client.then(async (client) => {
      return await client.sendImageAsStickerGif(
        number,
        filePath
      ).then((result) => {
        //console.log('Result: ', result); //return object success
        //return (result);
        //
        return {
          "erro": false,
          "status": 200,
          "number": number,
          "canReceiveMessage": true,
          "text": "success",
          "message": "Gif enviada com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //return (erro);
        //
        return {
          "erro": true,
          "status": 404,
          "number": number,
          "canReceiveMessage": false,
          "text": erro.text,
          "message": "Erro ao enviar gif"
        };
        //
      });
    });
    return resultsendImage;
  } //sendImageAsStickerGif
  //
  // ------------------------------------------------------------------------------------------------//
  //
  //Enviar figura png ou jpg
  static async sendImageAsSticker(
    SessionName,
    number,
    filePath
  ) {
    console.log("- Enviando figura.");
    var session = Sessions.getSession(SessionName);
    var resultsendImage = await session.client.then(async (client) => {
      return await client.sendImageAsSticker(
        number,
        filePath
      ).then((result) => {
        //console.log('Result: ', result); //return object success
        //return (result);
        //
        return {
          "erro": false,
          "status": 200,
          "number": number,
          "canReceiveMessage": true,
          "text": "success",
          "message": "Figura enviada com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //return (erro);
        //
        return {
          "erro": true,
          "status": 404,
          "number": number,
          "canReceiveMessage": false,
          "text": erro.text,
          "message": "Erro ao enviar figura"
        };
        //
      });
    });
    return resultsendImage;
  } //sendImageAsSticker
  //
  // ------------------------------------------------------------------------------------------------//
  //
  /*
  ╦═╗┌─┐┌┬┐┬─┐┬┌─┐┬  ┬┬┌┐┌┌─┐  ╔╦╗┌─┐┌┬┐┌─┐                
  ╠╦╝├┤  │ ├┬┘│├┤ └┐┌┘│││││ ┬   ║║├─┤ │ ├─┤                
  ╩╚═└─┘ ┴ ┴└─┴└─┘ └┘ ┴┘└┘└─┘  ═╩╝┴ ┴ ┴ ┴ ┴                
  */
  //
  // Recuperar contatos
  static async getAllContacts(
    SessionName
  ) {
    console.log("- Obtendo todos os contatos!");
    //
    var session = Sessions.getSession(SessionName);
    var resultgetAllContacts = await session.client.then(async client => {
      return await client.getAllContacts().then(async (result) => {
        //console.log('Result: ', result); //return object success
        //
        var getChatGroupNewMsg = [];
        //
        await forEach(result, async (resultAllContacts) => {
          //
          if (resultAllContacts.isMyContact === true || resultAllContacts.isMyContact === false && resultAllContacts.isUser === true) {
            //
            getChatGroupNewMsg.push({
              "user": resultAllContacts.id.user,
              "name": resultAllContacts.name,
              "shortName": resultAllContacts.shortName,
              "pushname": resultAllContacts.pushname,
              "formattedName": resultAllContacts.formattedName,
              "isMyContact": resultAllContacts.isMyContact,
              "isWAContact": resultAllContacts.isWAContact,
              "isBusiness": resultAllContacts.isBusiness,
            });
          }
          //
        });
        //
        return getChatGroupNewMsg;
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "canReceiveMessage": false,
          "text": "Error",
          "message": "Erro ao recuperar contatos"
        };
        //
      });
      //
    });
    //
    return resultgetAllContacts;
  } //getAllContacts
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Recuperar grupos
  static async getAllGroups(
    SessionName
  ) {
    console.log("- Obtendo todos os grupos!");
    //
    var session = Sessions.getSession(SessionName);
    var resultgetAllContacts = await session.client.then(async client => {
      return await client.getAllContacts().then(async (result) => {
        //console.log('Result: ', result); //return object success
        //
        var getChatGroupNewMsg = [];
        //
        await forEach(result, async (resultAllContacts) => {
          //
          if (resultAllContacts.isMyContact === false && resultAllContacts.isUser === false) {
            //
            getChatGroupNewMsg.push({
              "user": resultAllContacts.id.user,
              "name": resultAllContacts.name,
              "formattedName": resultAllContacts.formattedName,
              "isMyContact": resultAllContacts.isMyContact,
              "isWAContact": resultAllContacts.isWAContact,
              "isBusiness": resultAllContacts.isBusiness,
              "profilePicThumbObj": {
                "eurl": resultAllContacts.profilePicThumbObj.eurl,
                "img": resultAllContacts.profilePicThumbObj.img,
                "imgFull": resultAllContacts.profilePicThumbObj.imgFull
              }
            });
          }
          //
        });
        //
        return getChatGroupNewMsg;
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "canReceiveMessage": false,
          "text": "Error",
          "message": "Erro ao recuperar grupos"
        };
        //
      });
      //
    });
    //
    return resultgetAllContacts;
  } //getAllContacts
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Returns browser session token
  static async getSessionTokenBrowser(SessionName) {
    console.log("- Obtendo  Session Token Browser.");
    var session = Sessions.getSession(SessionName);
    var resultgetSessionTokenBrowser = await session.client.then(async client => {
      return await client.getSessionTokenBrowser().then((result) => {
        //console.log('Result: ', result); //return object success
        return result;
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "canReceiveMessage": false,
          "text": "Error",
          "message": "Erro ao recuperar token browser"
        };
        //
      });
    });
    return resultgetSessionTokenBrowser;
  } //getSessionTokenBrowser
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Chama sua lista de contatos bloqueados
  static async getBlockList(SessionName) {
    console.log("- getBlockList");
    var session = Sessions.getSession(SessionName);
    var resultgetBlockList = await session.client.then(async client => {
      return await client.getBlockList().then((result) => {
        //console.log('Result: ', result); //return object success
        return result;
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "canReceiveMessage": false,
          "text": "Error",
          "message": "Erro ao recuperar lista de contatos bloqueados"
        };
        //
      });
    });
    return resultgetBlockList;
  } //getBlockList
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Recuperar status de contato
  static async getStatus(
    SessionName,
    number
  ) {
    console.log("- Obtendo status!");
    var session = Sessions.getSession(SessionName);
    var resultgetStatus = await session.client.then(async client => {
      return await client.getStatus(number).then((result) => {
        //console.log('Result: ', result); //return object success
        return result;
      }).catch((erro) => {
        //console.error('Error when sending:\n', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "canReceiveMessage": false,
          "text": "Error",
          "message": "Erro ao recuperar status de contato"
        };
        //
      });
    });
    return resultgetStatus;
  } //getStatus
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Recuperar status de contato
  static async getNumberProfile(
    SessionName,
    number
  ) {
    console.log("- Obtendo status!");
    var session = Sessions.getSession(SessionName);
    var resultgetNumberProfile = await session.client.then(async client => {
      return await client.getNumberProfile(number).then((result) => {
        //console.log('Result: ', result); //return object success
        return result;
      }).catch((erro) => {
        //console.error('Error when sending:\n', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "canReceiveMessage": false,
          "text": "Error",
          "message": "Erro ao recuperar profile"
        };
        //
      });
    });
    return resultgetNumberProfile;
  } //getStatus
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Verificar o status do número
  static async checkNumberStatus(
    SessionName,
    number
  ) {
    console.log("- canReceiveMessage");
    var session = Sessions.getSession(SessionName);
    var resultcheckNumberStatus = await session.client.then(async client => {
      return await client.checkNumberStatus(number).then((result) => {
        //console.log('Result: ', chat); //return object success
        //
        if (result.status === 200 && result.canReceiveMessage === true) {
          //
          return {
            "erro": false,
            "status": result.status,
            "canReceiveMessage": result.canReceiveMessage,
            "number": result.id.user,
            "message": "O número informado pode receber mensagens via whatsapp"
          };
          //
        } else if (result.status === 404 && result.canReceiveMessage === false) {
          //
          return {
            "erro": true,
            "status": result.status,
            "canReceiveMessage": result.canReceiveMessage,
            "number": result.id.user,
            "message": "O número informado não pode receber mensagens via whatsapp"
          };
          //
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "canReceiveMessage": null,
            "number": number,
            "message": "Erro ao verificar número informado"
          };
          //
        }
      }).catch((erro) => {
        //console.error('Error when sending:\n', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "canReceiveMessage": null,
          "number": number,
          "message": "Erro ao verificar número informado"
        };
        //
      });
    });
    return resultcheckNumberStatus;
  } //checkNumberStatus
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Obter a foto do perfil do servidor
  static async getProfilePicFromServer(
    SessionName,
    number
  ) {
    console.log("- Obtendo a foto do perfil do servidor!");
    var session = Sessions.getSession(SessionName);
    var resultgetProfilePicFromServer = await session.client.then(async client => {
      try {
        const url = await client.getProfilePicFromServer(number);
        //console.log('Result: ', result); //return object success
        return url;
      } catch (erro) {
        //console.error('Error when sending:\n', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "canReceiveMessage": false,
          "text": "Error",
          "message": "Erro ao obtendo a foto do perfil no servidor"
        };
        //
      };
    });
    return resultgetProfilePicFromServer;
  } //getProfilePicFromServer
  //
  // ------------------------------------------------------------------------------------------------//
  //
  /*
  ╔═╗┬─┐┌─┐┬ ┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐               
  ║ ╦├┬┘│ ││ │├─┘  ╠╣ │ │││││   │ ││ ││││└─┐               
  ╚═╝┴└─└─┘└─┘┴    ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘               
  */
  //
  // Deixar o grupo
  static async leaveGroup(
    SessionName,
    groupId
  ) {
    console.log("- leaveGroup");
    var session = Sessions.getSession(SessionName);
    var resultleaveGroup = await session.client.then(async client => {
      return await client.leaveGroup(groupId).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "canReceiveMessage": true,
          "groupId": groupId,
          "message": "Grupo deixado com sucesso"
        };
        //
      }).catch((erro) => {
        // console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "canReceiveMessage": false,
          "groupId": groupId,
          "message": "Erro ao deixar o grupo"
        };
        //
      });
    });
    return resultleaveGroup;
  } //leaveGroup
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Obtenha membros do grupo
  static async getGroupMembers(
    SessionName,
    groupId
  ) {
    console.log("- getGroupMembers");
    var session = Sessions.getSession(SessionName);
    var resultgetGroupMembers = await session.client.then(async client => {
      return await client.getGroupMembers(groupId).then(async (result) => {
        //console.log('Result: ', result); //return object success
        //
        var getGroupMembers = [];
        //
        await forEach(result, async (resultGroupMembers) => {
          //
          if (resultGroupMembers.isMyContact === true || resultGroupMembers.isMyContact === false) {
            //
            getGroupMembers.push({
              "user": resultGroupMembers.id.user,
              "name": resultGroupMembers.name,
              "shortName": resultGroupMembers.shortName,
              "pushname": resultGroupMembers.pushname,
              "formattedName": resultGroupMembers.formattedName
            });
          }
          //
        });
        //
        return getGroupMembers;
        //
      }).catch((erro) => {
        //console.error('Error when sending:\n', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "canReceiveMessage": false,
          "groupId": groupId,
          "message": "Erro ao obter membros do grupo"
        };
        //
      });
    });
    return resultgetGroupMembers;
  } //getGroupMembers
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Obter IDs de membros do grupo
  static async getGroupMembersIds(
    SessionName,
    groupId
  ) {
    console.log("- getGroupMembersIds");
    var session = Sessions.getSession(SessionName);
    var resultgetGroupMembersIds = await session.client.then(async client => {
      return await client.getGroupMembersIds(groupId).then((result) => {
        //console.log('Result: ', result); //return object success
        return result;
      }).catch((erro) => {
        console.error('Error when sending:\n', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "canReceiveMessage": false,
          "groupId": groupId,
          "message": "Erro ao obter membros do grupo"
        };
        //
      });
    });
    return resultgetGroupMembersIds;
  } //getGroupMembersIds
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Gerar link de url de convite de grupo
  static async getGroupInviteLink(
    SessionName,
    groupId
  ) {
    console.log("- getGroupInviteLink");
    var session = Sessions.getSession(SessionName);
    var resultgetGroupInviteLink = await session.client.then(async client => {
      return await client.getGroupInviteLink(groupId).then((result) => {
        //console.log('Result: ', result); //return object success
        return result;
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "canReceiveMessage": false,
          "groupId": groupId,
          "message": "Erro ao obter link de convite de grupo"
        };
        //
      });
    });
    return resultgetGroupInviteLink;
  } //getGroupInviteLink
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Criar grupo (título, participantes a adicionar)
  static async createGroup(
    SessionName,
    title,
    contactlistValid,
    contactlistInvalid
  ) {
    console.log("- createGroup");
    var session = Sessions.getSession(SessionName);
    var resultgetGroupInviteLink = await session.client.then(async client => {
      return await client.createGroup(title, contactlistValid).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        if (result.status === 200) {
          return {
            "erro": false,
            "status": 200,
            "gid": result.gid.user,
            "contactlistValid": contactlistValid,
            "contactlistInvalid": contactlistInvalid,
            "message": "Grupo criado com a lista de contatos validos"
          };
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "gid": null,
            "contactlistValid": contactlistValid,
            "contactlistInvalid": contactlistInvalid,
            "message": "Erro ao criar grupo"
          };
          //
        }
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "gid": null,
          "contactlistValid": contactlistValid,
          "contactlistInvalid": contactlistInvalid,
          "message": "Erro ao criar grupo"
        };
        //
      });
    });
    return resultgetGroupInviteLink;
  } //createGroup
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Remove participante
  static async removeParticipant(
    SessionName,
    groupId,
    phonefull
  ) {
    console.log("- removeParticipant");
    var session = Sessions.getSession(SessionName);
    var resultremoveParticipant = await session.client.then(async client => {
      return await await client.removeParticipant(groupId, phonefull).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        if (result === true) {
          return {
            "erro": false,
            "status": 200,
            "number": phonefull,
            "message": "Participante removido com sucesso"
          };
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "number": phonefull,
            "message": "Erro ao remover participante"
          };
          //
        }
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "number": phonefull,
          "message": "Erro ao remover participante"
        };
        //
      });
    });
    return resultremoveParticipant;
  } //removeParticipant
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Adicionar participante
  static async addParticipant(
    SessionName,
    groupId,
    phonefull
  ) {
    console.log("- addParticipant");
    var session = Sessions.getSession(SessionName);
    var resultaddParticipant = await session.client.then(async client => {
      return await client.addParticipant(groupId, phonefull).then((result) => {
        //console.log('Result: ', addParticipant); //return object success
        //
        if (result === true) {
          return {
            "erro": false,
            "status": 200,
            "number": phonefull,
            "message": "Participante adicionado com sucesso"
          };
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "number": phonefull,
            "message": "Erro ao adicionar participante"
          };
          //
        }
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "number": phonefull,
          "message": "Erro ao adicionar participante"
        };
        //
      });
    });
    return resultaddParticipant;
  } //addParticipant
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Promote participant (Give admin privileges)
  static async promoteParticipant(
    SessionName,
    groupId,
    number
  ) {
    console.log("- promoteParticipant");
    var session = Sessions.getSession(SessionName);
    var resultpromoteParticipant = await session.client.then(async client => {
      return await client.promoteParticipant(groupId, number).then((result) => {
        //console.log('Result: ', promoteParticipant); //return object success
        //
        if (result === true) {
          return {
            "erro": false,
            "status": 200,
            "number": number,
            "message": "Participante promovido a administrador"
          };
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "number": number,
            "message": "Erro ao promover participante a administrador"
          };
          //
        }
        //
      }).catch((erro) => {
        console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "number": number,
          "message": "Erro ao promover participante a administrador"
        };
        //
      });
    });
    return resultpromoteParticipant;
  } //promoteParticipant
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Depromote participant (Give admin privileges)
  static async demoteParticipant(
    SessionName,
    groupId,
    phonefull
  ) {
    console.log("- demoteParticipant");
    var session = Sessions.getSession(SessionName);
    var resultdemoteParticipant = await session.client.then(async client => {
      return await client.demoteParticipant(groupId, phonefull).then((result) => {
        //console.log('Result: ', demoteParticipant); //return object success
        //
        if (demoteParticipant === true) {
          return {
            "erro": false,
            "status": 200,
            "number": phonefull,
            "message": "Participante removido de administrador"
          };
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "number": phonefull,
            "message": "Erro ao remover participante de administrador"
          };
          //
        }
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "number": phonefull,
          "message": "Erro ao remover participante de administrador"
        };
        //
      });
    });
    return resultdemoteParticipant;
  } //demoteParticipant
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Retorna o status do grupo, jid, descrição do link de convite
  static async getGroupInfoFromInviteLink(
    SessionName,
    InviteCode
  ) {
    console.log("- Obtendo chats!");
    var session = Sessions.getSession(SessionName);
    var resultgetGroupInfoFromInviteLink = await session.client.then(async client => {
      return await client.getGroupInfoFromInviteLink(InviteCode).then((result) => {
        //console.log('Result: ', result); //return object success
        return result;
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao obter link de convite"
        };
        //
      });
    });
    return resultgetGroupInfoFromInviteLink;
  } //getGroupInfoFromInviteLink
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Junte-se a um grupo usando o código de convite do grupo
  static async joinGroup(
    SessionName,
    InviteCode
  ) {
    console.log("- joinGroup");
    var session = Sessions.getSession(SessionName);
    var resultjoinGroup = await session.client.then(async client => {
      return await await client.joinGroup(InviteCode).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        if (result.status === 200) {
          return {
            "erro": false,
            "status": 200,
            "message": "Convite para grupo aceito com suceso"
          };
        } else {
          //
          return {
            "erro": true,
            "status": 404,
            "message": "Erro ao aceitar convite para grupo"
          };
          //
        }
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao entra no grupo via convite"
        };
        //
      });
    });
    return resultjoinGroup;
  } //joinGroup
  //
  // ------------------------------------------------------------------------------------------------//
  //
  /*
  ╔═╗┬─┐┌─┐┌─┐┬┬  ┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐           
  ╠═╝├┬┘│ │├┤ ││  ├┤   ╠╣ │ │││││   │ ││ ││││└─┐           
  ╩  ┴└─└─┘└  ┴┴─┘└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘           
  */
  //
  // Set client status
  static async setProfileStatus(
    SessionName,
    ProfileStatus
  ) {
    console.log("- setProfileStatus");
    var session = Sessions.getSession(SessionName);
    var resultsetProfileStatus = await session.client.then(async client => {
      return await client.setProfileStatus(ProfileStatus).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Profile status alterado com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //return erro;
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao alterar profile status."
        };
        //
      });
    });
    return resultsetProfileStatus;
  } //setProfileStatus
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Set client profile name
  static async setProfileName(
    SessionName,
    ProfileName
  ) {
    console.log("- setProfileName");
    var session = Sessions.getSession(SessionName);
    var resultsetProfileName = await session.client.then(async client => {
      return await client.setProfileName(ProfileName).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Profile name alterado com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //return erro;
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao alterar profile name."
        };
        //
      });
    });
    return resultsetProfileName;
  } //setProfileName
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Set client profile photo
  static async setProfilePic(
    SessionName,
    path
  ) {
    console.log("- setProfilePic");
    var session = Sessions.getSession(SessionName);
    var resultsetProfilePic = await session.client.then(async client => {
      return await client.setProfilePic(path).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Profile pic alterado com sucesso."
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao alterar profile pic."
        };
        //
      });
    });
    return resultsetProfilePic;
  } //setProfilePic
  //
  // ------------------------------------------------------------------------------------------------//
  //
  /*
  ╔╦╗┌─┐┬  ┬┬┌─┐┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐             
   ║║├┤ └┐┌┘││  ├┤   ╠╣ │ │││││   │ ││ ││││└─┐             
  ═╩╝└─┘ └┘ ┴└─┘└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘             
  */
  //
  // Delete the Service Worker
  static async killServiceWorker(SessionName) {
    console.log("- killServiceWorker");
    var session = Sessions.getSession(SessionName);
    var resultkillServiceWorker = await session.client.then(async client => {
      return await client.killServiceWorker().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Serviço parado com sucesso.",
          "killService": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao parar serviço."
        };
        //
      });
    });
    return resultkillServiceWorker;
  } //killServiceWorker
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Load the service again
  static async restartService(SessionName) {
    console.log("- restartService");
    var session = Sessions.getSession(SessionName);
    var resultrestartService = await session.client.then(async client => {
      return await client.restartService().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Serviço reiniciado com sucesso.",
          "restartService": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao reiniciar serviço."
        };
        //
      });
    });
    return resultrestartService;
  } //restartService
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Get device info
  static async getHostDevice(SessionName) {
    console.log("- getHostDevice");
    var session = Sessions.getSession(SessionName);
    var resultgetHostDevice = await session.client.then(async client => {
      return await client.getHostDevice().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Dados do dispositivo obtido com sucesso",
          "HostDevice": {
            "user": result.wid.user,
            "connected": result.connected,
            "isResponse": result.isResponse,
            "battery": result.battery,
            "plugged": result.plugged,
            "locales": result.locales,
            "is24h": result.is24h,
            "device_manufacturer": result.phone.device_manufacturer,
            "platform": result.platform,
            "os_version": result.phone.os_version,
            "wa_version": result.phone.wa_version,
            "pushname": result.pushname
          }
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao obter dados do dispositivo"
        };
        //
      });
    });
    return resultgetHostDevice;
  } //getHostDevice
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Get connection state
  static async getConnectionState(SessionName) {
    console.log("- getConnectionState");
    var session = Sessions.getSession(SessionName);
    var resultisConnected = await session.client.then(async client => {
      return await client.getConnectionState().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Estado do dispositivo obtido com sucesso",
          "ConnectionState": result

        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao obter o estado da conexão"
        };
        //
      });
    });
    return resultisConnected;
  } //getConnectionState
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Get battery level
  static async getBatteryLevel(SessionName) {
    console.log("- getBatteryLevel");
    var session = Sessions.getSession(SessionName);
    var resultgetBatteryLevel = await session.client.then(async client => {
      return await client.getBatteryLevel().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Nivel da bateria obtido com sucesso",
          "BatteryLevel": result

        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao obter o nivel da bateria"
        };
        //
      });
    });
    return resultgetBatteryLevel;
  } //getBatteryLevel
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Is Connected
  static async isConnected(SessionName) {
    console.log("- isConnected");
    var session = Sessions.getSession(SessionName);
    var resultisConnected = await session.client.then(async client => {
      return await client.isConnected().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Estatus obtido com sucesso",
          "Connected": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao obter estatus"
        };
        //
      });
    });
    return resultisConnected;
  } //isConnected
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Obter versão do WhatsappWeb
  static async getWAVersion(SessionName) {
    console.log("- getWAVersion");
    var session = Sessions.getSession(SessionName);
    var resultgetWAVersion = await session.client.then(async client => {
      return await client.getWAVersion().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Versão do WhatsappWeb obtido com sucesso",
          "WAVersion": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao obter versão do WhatsappWeb"
        };
        //
      });
    });
    return resultgetWAVersion;
  } //getWAVersion
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Inicia a verificação de conexão do telefone
  static async startPhoneWatchdog(SessionName, interval) {
    console.log("- startPhoneWatchdog");
    var session = Sessions.getSession(SessionName);
    var resultgetWAVersion = await session.client.then(async client => {
      return await client.startPhoneWatchdog(interval).then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Verificação de conexão do telefone iniciada com sucesso",
          "PhoneWatchdog": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao inicia a verificação de conexão do telefone"
        };
        //
      });
    });
    return resultgetWAVersion;
  } //startPhoneWatchdog
  //
  // ------------------------------------------------------------------------------------------------//
  //
  // Para a verificação de conexão do telefone
  static async stopPhoneWatchdog(SessionName) {
    console.log("- stopPhoneWatchdog");
    var session = Sessions.getSession(SessionName);
    var resultgetWAVersion = await session.client.then(async client => {
      return await client.stopPhoneWatchdog().then((result) => {
        //console.log('Result: ', result); //return object success
        //
        return {
          "erro": false,
          "status": 200,
          "message": "Verificação de conexão parada iniciada com sucesso",
          "PhoneWatchdog": result
        };
        //
      }).catch((erro) => {
        //console.error('Error when sending: ', erro); //return object error
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Erro ao parar a verificação de conexão do telefone"
        };
        //
      });
    });
    return resultgetWAVersion;
  } //getWAVersion
  //
  // ------------------------------------------------------------------------------------------------//
  //
  /*
  ╔╦╗┌─┐┌─┐┌┬┐┌─┐┌─┐  ┌┬┐┌─┐  ╦═╗┌─┐┌┬┐┌─┐┌─┐
   ║ ├┤ └─┐ │ ├┤ └─┐   ││├┤   ╠╦╝│ │ │ ├─┤└─┐
   ╩ └─┘└─┘ ┴ └─┘└─┘  ─┴┘└─┘  ╩╚═└─┘ ┴ ┴ ┴└─┘
   */
  //
  // ------------------------------------------------------------------------------------------------//
  //
  static async RotaTeste() {

  } //RotaTeste
  //
  // ------------------------------------------------------------------------------------------------//
  //
}