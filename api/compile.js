const express = require("express");
const solc = require("solc");

const router = express.Router();

router.post("/ll3/api/compile", async (req, res) => {

  const {
    sourceCode,
    contractName,
    enableOptimization,
    optimizationRuns
  } = req.body;

  try {

    const input = {
      language: "Solidity",
      sources: {
        "Contract.sol": {
          content: sourceCode
        }
      },
      settings: {
        optimizer: {
          enabled: enableOptimization,
          runs: optimizationRuns
        },
        outputSelection: {
          "*": {
            "*": [
              "abi",
              "evm.bytecode"
            ]
          }
        }
      }
    };

    const output = JSON.parse(
      solc.compile(JSON.stringify(input))
    );

    const contract =
      output.contracts["Contract.sol"][contractName];

    res.json({
      success: true,
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object,
      metadata: contract.metadata
    });

  } catch (error) {

    res.json({
      success: false,
      error: error.message
    });

  }
  
  const fs = require("fs");

router.get("/contract.sol", (req, res) => {

  const contract = fs.readFileSync(
    "./api/contract.sol",
    "utf8"
  );

  res.send(contract);

});

});

module.exports = router;
