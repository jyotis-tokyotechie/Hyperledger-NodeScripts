var network = require('../handler/network');
var async = require("async");
const Config = require("../config/config");


module.exports = {

    //================ set transaction Api========================
    transSetdata: async (req, res) => {
        console.log("============transSetdata req.body=======", req.body);
        if (!req.body.transid) return res.send({statusCode : "400" , Message : "ID is required."});
        if (!req.body.date) return res.send({statusCode : "400" , Message : "Date is required."});
        let HyperObj ={
            "transid": req.body.transid,
            "type":req.body.type,
            "quantity":req.body.quantity,
            "metal":req.body.metal,
            "date":req.body.date,
            "time":req.body.time,
            "makingCharge":req.body.makingCharge,
            "userid":req.body.userid
            }
        obj = {
            chainId: Config.chainId,
            chaincodeId: Config.chaincodeId,
            fnc: "setTransaction",
            args: [JSON.stringify(HyperObj)]
        }
        console.log('============== obj ============', obj)
        network.publishStream(obj, (cb) => {
            console.log("\n\n\n\n\n =============hyperledger call back======", cb);
            if (cb.statusCode == 200) {
                resp = JSON.parse(cb.chData[0][0].response.payload)
                console.log("\n\n\n===============Hyperledger success set data \n", resp);
                return res.send({ statuscode: "200", data: resp })
            }
            else  if (cb.statusCode == 500){
                console.log('=================== hyperledger Error ==================', cb.data.endorsements[0].message)
                return res.send( { statuscode : 500,error : cb.data.endorsements[0].message } )
            }
        })

    },
    //=============== get Transaction Apis ==========================
    transgetdata: async (req, res) => {
        console.log("============transGetdata req.body=======", req.body);
        obj = {
            chainId: Config.chainId,
            chaincodeId: Config.chaincodeId,
            fnc: "getTransaction",
            args: [req.body.transid]
        }
        console.log('============== obj ============', obj)
        network.publishStream(obj, (cb) => {
            console.log("\n\n\n\n\n =============hyperledger call back======", cb);
            if (cb.statusCode == 200) {
                resp = JSON.parse(cb.chData[0][0].response.payload)
                console.log("\n\n\n===============Hyperledger success set data \n", resp);
                return res.send({ statuscode: "200", data: resp })
            }
            else  if (cb.statusCode == 500){
                console.log('=================== hyperledger Error ==================', cb.data.endorsements[0].message)
                return res.send( { statuscode : 500,error : cb.data.endorsements[0].message } )
            }
        })

    },
    //============GetHistoryData=========================
    transgetHistorydata: async (req, res) => {
        console.log("============transGetHistorydata req.body=======", req.body);

        obj = {
            chainId: Config.chainId,
            chaincodeId: Config.chaincodeId,
            fnc: "getHistoryForId",
            args: [req.body.transid]
        }
        console.log('============== obj ============', obj)
        network.publishStream(obj, (cb) => {
            console.log("\n\n\n\n\n =============hyperledger call back======", cb);
            if (cb.statusCode != 200 ) {
                console.log('RESULT FROM HYPERLEDGER ===========>', success);
                console.log('The record may not exist')
                console.log('=================== hyperledger Error ==================', cb.data.endorsements[0].message)
                return res.send( { statuscode : 500,error : cb.data.endorsements[0].message } )
            }
            else  {  
                resp = JSON.parse(cb.chData[0][0].response.payload.toString())
                console.log("\n\n\n===============Hyperledger success set History data \n", resp);
                return res.send({ statuscode: "200", data: resp })
                
            }
        });

    }

}
