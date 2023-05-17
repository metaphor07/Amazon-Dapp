const { expect } = require("chai");

// this tokens() function will basically conver ether->wei
// means, if we call 1 ether it returns 1000000000000000000 wei
const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

// Golbal constants to listining an item
let transaction;
const ID = 1;
const NAME = "Shoes";
const CATEGORY = "Foot Wear";
const IMAGE =
  "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg";
const COST = tokens(1);
const RATING = 4;
const STOCK = 12;

describe("Dappazon", () => {
  let dappazon;
  let deployer, buyer;

  // we are deploy() the contract here
  beforeEach(async () => {
    // basically, hardhat has a local blockchain for you system
    // and, when we call the "getSigner()" it returns the fake "accounts" of that local system blockchain
    // and, we can access them for the assign "manager" of the contract of etc
    [deployer, buyer] = await ethers.getSigners(); //so, in our fake system(hardhat) generatd blockchain we have more than 10 accounts,
    //  and it will return the first two accounts, and assign the value in this two variable
    // console.log("Deployer is: ", deployer)
    // console.log("Buyer is: ", buyer)

    // we difine the deploy() function here which need for every "it" function
    const Dappazon = await ethers.getContractFactory("Dappazon"); //it means, we are choose "Dappazon" contract to test in this
    dappazon = await Dappazon.deploy(); //after create a instance of the contract we are simply deploy it
  });

  describe("Deployment", async () => {
    it("Sets the owner", async () => {
      expect(await dappazon.owner()).to.equal(deployer.address);
    });
  });

  describe("Listing", () => {
    let transaction;

    beforeEach(async () => {
      // List a item
      transaction = await dappazon
        .connect(deployer)
        .listingTheItem(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);
      await transaction.wait();
    });

    it("Returns item attributes", async () => {
      const item = await dappazon.items(ID);

      expect(item.id).to.equal(ID);
      expect(item.name).to.equal(NAME);
      expect(item.category).to.equal(CATEGORY);
      expect(item.image).to.equal(IMAGE);
      expect(item.cost).to.equal(COST);
      expect(item.rating).to.equal(RATING);
      expect(item.stock).to.equal(STOCK);
    });

    it("Emits List event", () => {
      expect(transaction).to.emit(dappazon, "List");
    });
  });

  describe("Buying", () => {
    let transaction;
    beforeEach(async () => {
      // it means, connect with the manager(deployer) and then call the listining function of the contract
      transaction = await dappazon
        .connect(deployer)
        .listingTheItem(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);
      await transaction.wait(); //means, wait() untill transaction is not complete

      // buy an item
      // here, the "buyer" send the "cost" of the item, and it store in the contract
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST });
      await transaction.wait();
    });

    it("Update buyer's order count", async () => {
      const result = await dappazon.orderCount(buyer.address);
      console.log("order count update", result);
      expect(result).to.equal(1);
    });

    it("Adds the order to the chain", async () => {
      const order = await dappazon.orders(buyer.address, 1);
      expect(order.time).to.be.greaterThan(0);
      expect(order.item.name).to.equal(NAME);
    });

    it("Update the Contract balance", async () => {
      const result = await ethers.provider.getBalance(dappazon.address); //IT returns the contract balance
      expect(result).to.equal(COST);
    });

    it("Emits Buy event", () => {
      expect(transaction).to.emit(dappazon, "Buy");
    });
  });

  describe("Withdrawing", () => {
    let balanceBefore;

    beforeEach(async () => {
     let transaction = await dappazon
        .connect(deployer)
        .listingTheItem(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK);
      await transaction.wait();

      transaction = await dappazon.connect(buyer).buy(ID, { value: COST });

      // get the balance of the "owner" before run withdraw function
      balanceBefore = await ethers.provider.getBalance(deployer.address);

      // now run the "withdraw" func of the contract
      transaction = await dappazon.connect(deployer).withdraw();
      await transaction.wait();
    });

    it("Updates the owner balance", async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Update contract balance", async () => {
      const contractBalance = await ethers.provider.getBalance(
        dappazon.address
      );
      expect(contractBalance).to.equal(0);
    });
  });
});
