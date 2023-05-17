// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")
const { items } = require("../src/items.json")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
  // setup deployer account //it takes the first account of your local system blockchain
  const [deployer] = await ethers.getSigners()

  // now, deploy() the contract
  const Dappazon = await hre.ethers.getContractFactory("Dappazon");
  const dappazon = await Dappazon.deploy();
  await dappazon.deployed();

  console.log(`Deployed Dappazon contract at: ${dappazon.address}`)

  // listing the items, which store in this path{"../src/items.json"}, as a "json" format
  items.forEach(async(item) =>{
    // we need to distrcuture form the "item"
    const {id, name, category, image, price, rating, stock} = item;

    const transaction = await dappazon.connect(deployer).listingTheItem(
     id, name, category, image, tokens(price), rating, stock
    )
    await transaction.wait();
    console.log("Listed item", id,":", name);
  })

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
