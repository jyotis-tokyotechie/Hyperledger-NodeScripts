'use strict';

const Fabric_Client = require('fabric-client');
const path = require('path');
const util = require('util');
const fs=require('fs');
//const constants = require('./Config/constants').fabric.const
const constants=require('../hyperledger/hyperConst.js').fabric.const;
//loading config.json
const config_path = path.resolve(__dirname, constants.configPath);
//const config_path=require('./hyperConfig.js');

const adminusers = new Map();
var cr, channel;
const all_config = JSON.parse(fs.readFileSync(config_path, 'utf8'));
const client_configs = all_config['network-configs']['network-1'];
console.log("client_configs",client_configs);
let client_config = client_configs;
client_config.client = client_configs.clients['client-1'];
client_config.version = client_configs.version;
client_config.channels = client_configs.channels;
client_config.organizations = client_configs.organizations;
client_config.peers = client_configs.peers;
client_config.orderers = client_configs.orderers;
client_config.certificateAuthorities = client_configs.certificateAuthorities;


// console.log('============================= client config =====================', client_config)

const fabric_client = new Fabric_Client(client_config);
let serverCert1 = fs.readFileSync(path.join(__dirname, '../hyperledger/db9cd48a205956c01902865baa28a52f36845344144121db048eb727ed71df79_sk'));
console.log("serverCert1", serverCert1);
var peer0qtl = fabric_client.newPeer("grpcs://peer0.igx.example.com:7051",{
 
  'ssl-target-name-override': 'peer0.igx.example.com',
  'pem': Buffer.from(serverCert1).toString()
});
let serverCert = fs.readFileSync(path.join(__dirname, '../hyperledger/tlsca.igx.com-cert.pem'));
console.log("serverCert",serverCert)     
  // Reading certificates for orderer
var orderer = fabric_client.newOrderer("grpcs://orderer.igx.com:7050",
{
'pem': Buffer.from(serverCert).toString()
});
//await fabric_client.initialize(client_config)
fabric_client.getConfigSetting('discovery-as-localhost', constants.asLocalhost)
fabric_client.setConfigSetting('discovery-protocol', constants.portocol);
const default_options = fabric_client.getConfigSetting('connection-options');
const new_option = {
	"grpc.max_receive_message_length": 200 * 1024 *1024,
	"grpc.max_send_message_length": 200 * 1024 * 1024,
};
console.log("line")

// use the assign call to keep all other options and only update
// the one setting or add a setting.
const new_defaults = Object.assign(default_options, new_option);
fabric_client.setConfigSetting('connection-options', new_defaults);
//loading defined client profile
fabric_client.loadFromConfig(client_config);
//loading predefined user  if any
fabric_client.initCredentialStores();

// console.log('Created client side object to represent the channel', fabric_client);

// let serverCert = fs.readFileSync(path.join(__dirname, constants.serverKey));
//
// let clientKey = fs.readFileSync(path.join(__dirname, constants.clientKey));
// let clientCert = fs.readFileSync(path.join(__dirname, constants.clientCert));

module.exports = {
  publishStream :async (data,callback)=>{
    console.log("=========Data=========",data);
    var cts=Date.now();
    var ts; 
    var ts1;
    var ts2;
    var ts3
    console.log("========Start time in seconds ==========",Math.floor(cts/1000));
    //load organizations defined in the config
const organization = fabric_client._network_config.getOrganization(client_config.client.organization,true);
if (organization) {
    const mspid = organization.getMspid();
    const admin_key = organization.getAdminPrivateKey();
    const admin_cert = organization.getAdminCert();
    const username = constants.defaultUser;

    //create admin user
    await fabric_client.createUser({
      username,
      mspid,
      cryptoContent: {
      privateKeyPEM: admin_key,
      signedCertPEM: admin_cert
      },
      skipPersistence: false
    })
    adminusers.set(username);
}

    //console.log('================================ DEFAULT CHANNEL ============================\n\n\n\n', defaultChannel)
    console.log('\n\n --- invoke.js - start');
    try {
        console.log('Setting up client side network objects');
        // fabric client instance
        // starting point for all interactions with the fabric network with defined config
        //load the channel defined in the config
        //no need to redefine the channel as we have already loaded
        const channel_name = data.chainId;
        console.log("channel_name",channel_name);
        const defaultChannel = fabric_client.getChannel(channel_name);

        //console.log("channels::::::::::::::::::::::::::::::::::::::::::",await fabric_client.queryChannels(,true))
        // var peers = defaultChannel._channel_peers;
        
        var defaultPeer = constants.defaultPeer;
        fabric_client._network_config._network_config.channels[channel_name] = channel_name
        // defaultChannel.addPeer(peer0qtl);
        // defaultChannel.addOrderer(orderer);
        defaultChannel.initialize({
        discover: true,
        asLocalhost:constants.asLocalhost,
        target:  constants.defaultPeer
        });
        console.log("start discoverry result");
      //  const discover_results=await defaultChannel.getDiscoveryResults();
        // const discover_results = await defaultChannel._discover(discover_request);
       // console.log('discover-----result================ /n/n/n',discover_results.orderers.OrdererMSP,"Peer byOrg", discover_results.peers_by_org.QTLMSP,"endorsment plan",discover_results.endorsement_plans[0].groups);

        // get the enrolled user from persistence and assign to the client instance
        //    this user will sign all requests for the fabric network
        //const user =  await fabric_client.getUserContext(constants.defaultUser, true);
        //  console.log('===================== uSER =======\n\n\n\n', user)
       // if (user && user.isEnrolled()) {
       //     console.log('Successfully loaded "admin" from user store');
       // } else {
        //    throw new Error('\n\nFailed to get admin.... run registerUser.js');
        //}
        //console.log("User==========", fabric_client.getUserContext(constants.defaultUser, true));

        //  console.log('\n\nStart invoke processing',data.transientMap);

        // get a transaction id object based on the current user assigned to fabric client
        // Transaction ID objects contain more then just a transaction ID, also includes
        // a nonce value and if built from the client's admin user.
        const tx_id = fabric_client.newTransactionID();
        // transientMap = request.getTransientMap();
        console.log(util.format("\nCreated a transaction ID: %s",  tx_id._transaction_id));
        const proposal_request = {
            chaincodeId: data.chaincodeId,
            fcn: data.fnc,
            args:data.args,
            chainId: data.chainId,
            txId: tx_id
            
        };
        console.log('proposal_request',proposal_request);
        // notice the proposal_request has the peer defined in the 'targets' attribute

        // Send the transaction proposal to the endorsing peers.
        // The peers will run the function requested with the arguments supplied
        // based on the current state of the ledger. If the chaincode successfully
        // runs this simulation it will return a postive result in the endorsement.
        // console.log("sendTransactionProposal ------starts", proposal_request);
        defaultChannel.sendTransactionProposal(proposal_request)
        .then((results) => {
            console.log("===========Result=============",results[0][0]);
            cr=results;
            var proposalResponses = results[0];
            var proposal = results[1];
            let isProposalGood = false;
            if (proposalResponses && proposalResponses[0].response &&
            proposalResponses[0].response.status === 200) {
            isProposalGood = true;
            console.log('Transaction proposal was good');
            ts = Date.now();
            //console.log('Time taken to for peer endorsement in seconds ========> ',Math.floor(ts/1000))
            console.log("endorsment time for qtl", Number(ts) - Number(cts))
            } else {
            console.error('\n\n===============Transaction proposal was bad==========\n\n', proposalResponses);
            }
            if (isProposalGood) {

            console.log(util.format(
            'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
            proposalResponses[0].response.status, proposalResponses[0].response.message));
           
            // build up the request for the orderer to have the transaction committed
            var request = {
            proposalResponses: proposalResponses,
            proposal: proposal
            };

            // set the transaction listener and set a timeout of 30 sec
            // if the transaction did not get committed within the timeout period,
            // report a TIMEOUT status
            var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
            var promises = [];

            var sendPromise = defaultChannel.sendTransaction(request);
            promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

            // get an eventhub once the fabric client has a user assigned. The user
            // is required bacause the event registration must be signed
            let event_hub = defaultChannel.newChannelEventHub(defaultPeer) //defaultPeer



            // using resolve the promise so that result status may be processed
            // under the then clause rather than having the catch clause process
            // the status
            let txPromise = new Promise((resolve, reject) => {
            let handle = setTimeout(() => {
            event_hub.unregisterTxEvent(transaction_id_string);
            event_hub.disconnect();
            resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
            }, 4500000);

            event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
            // this is the callback for transaction event status
            // first some clean up of event listener
            clearTimeout(handle);
            // now let the application know what happened
            var return_status = {event_status : code, tx_id : transaction_id_string};
            if (code !== 'VALID') {
            console.error('The transaction was invalid, code = ' +code);
            console.log("if if event status is invalid .....................",Number(ts1) - Number(ts))
            resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
            } else {
            console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
            ts1 = Date.now();
            // console.log('Time taken to commit data on peer in seconds ========> ',Math.floor(ts1/1000))
            console.log("transaction time taken to commit data on peer", Number(ts1) - Number(ts))
            resolve(return_status);
            }
            }, (err) => {
            //this is the callback if something goes wrong with the event registration or processing
            reject(new Error('There was a problem with the eventhub ::'+err));
            },
            {disconnect: true} //disconnect when complete
            );
            event_hub.connect();

            });
            promises.push(txPromise);

            return Promise.all(promises);
            } else {
            console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
            //return callback({statusCode: 500, data: proposalResponses[0].message})
                    console.log("========Network JS Error============", proposalResponses[0].message);
            throw new Error(JSON.stringify({status: 500, data: proposalResponses[0].message}));
            }
            }).then((results) => {
                console.log('Send transaction promise and event listener promise have completed');
                console.log("commititngresults ", results , "#################", results[0], "@@@@@@@@@@@@@@@@@@@", results[1]); 
               // check the results in the order the promises were added to the promise all list
                if (results && results[0] && results[0].status === 'SUCCESS') {
                    console.log('Successfully sent transaction to the orderer.');
                    ts2 = Date.now();
                     console.log('if result[0].status is true',Number(ts2) - Number(ts1));
                } else {
                     console.error('Failed to order the transaction. Error code: ' + results[0].status);
                }

                if(results && results[1] && results[1].event_status === 'VALID') {
                console.log('Successfully committed the change to the ledger by the peer');
                console.log('if event_status is ture ',Number(ts2) - Number(ts1))
                callback({statusCode:200,data:results,chData:cr});
                } else {
                console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
                console.log("if event_status is false", Number(ts2) - Number(ts1));
                callback({statusCode: 500, data:'Transaction failed to be committed to the ledger due to ::'+results[1].event_status,chData:cr});
                }
            }).catch((err) => {
                    console.error({statusCode: 500, data:'Failed to invoke successfully :: ' + err});
                    callback({statusCode: 500, data: err,chData:cr})
            });
    } catch(error) {
        console.log('Unable to invoke ::'+ error.toString());
        callback({statusCode:500,error:error})
    }
    console.log('\n\n --- invoke.js - end');

  },

  listStreamKeyItems:  (req, res, queryData,callback)=>{
   


      try {
        console.log('Setting up client side network objects');

        const channel_name = queryData.chainId;

    const defaultChannel = fabric_client.getChannel(channel_name);

    //console.log("channels::::::::::::::::::::::::::::::::::::::::::",await fabric_client.queryChannels(,true))
    var peers = defaultChannel._channel_peers;
    var defaultPeer = constants.defaultPeer;
    fabric_client._network_config._network_config.channels[channel_name] = channel_name

    const discover_request = {
      target: defaultPeer,
      config: true
    };

    defaultChannel.initialize({
      discover: true,
      asLocalhost: constants.asLocalhost,
      target: constants.defaultPeer
    });
    

    defaultChannel._discover(discover_request)
    .then(discover_results => {
    console.log('discover-----result================ /n/n/',discover_results);

        // get the enrolled user from persistence and assign to the client instance
        //    this user will sign all requests for the fabric network
        fabric_client.getUserContext(constants.defaultUser, true)
        .then( user => { 
        // console.log('===================== uSER =======\n\n\n\n', user)
        if (user && user.isEnrolled()) {
          console.log('Successfully loaded "admin" from user store');
        } else {
          throw new Error('\n\nFailed to get admin.... run registerUser.js');
        }
        // console.log("User==========",await fabric_client.getUserContext(constants.defaultUser, true));

        console.log('\n\nStart invoke processing');

        // get a transaction id object based on the current user assigned to fabric client
        // Transaction ID objects contain more then just a transaction ID, also includes
        // a nonce value and if built from the client's admin user.
        console.log("fabric-client-networkkkkkkkkkkkkkkkkkkkkkkkkkkk");
        fabric_client.newTransactionID()
        .then(tx_id =>{ 
        console.log(util.format("\nCreated a transaction ID: %s",  tx_id._transaction_id));
        const request = {
          chaincodeId:queryData.chaincodeId,
          fcn: queryData.functionName,
          args: queryData.args,
          transientMap:queryData.transientMap
        };
        console.log('************************* REQUEST *********************', request)
        // send the query proposal to the peer
        defaultChannel.queryByChaincode(request)
        .then((query_responses) => {
          //console.log("query Response=============",query_responses);
            console.log("Query has completed, checking results", query_responses.toString());
            // query_responses could have more than one  results if there multiple peers were used as targets
            if (query_responses && query_responses.length >= 1) {
              console.log('============== inside if =================')
                // if (query_responses[0] instanceof Error) {
                //     console.error("error from query = ", query_responses[0]);
                //     callback({statusCode:500,data:query_responses[0].toString()})
                // } else {
                //   console.log("Response is ", query_responses[0].toString());
                callback({statusCode:200,data:query_responses[0]})
                // }
            } else {
                console.log("No payloads were returned from query");
            }
        }).catch((err) => {
            console.error('Failed to query successfully :: ' + err);
            callback({statusCode: 500, data: err})
            //callback(err)
        });

        
      } )
      })
      })
      }
      catch(error) {

        console.log('Unable to invoke ::'+ error.toString());
        callback({statusCode:500,error:error})
      }



  },
}