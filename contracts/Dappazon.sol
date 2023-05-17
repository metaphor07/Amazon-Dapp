// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Dappazon {
    address public owner;

    struct Item {
        uint256 id;
        string name;
        string category;
        string image;
        uint256 cost;
        uint256 rating;
        uint256 stock;
    }

    struct Order {
        uint256 time; //we take it, cause each order has to unique timeStamp and we can arrange them by the timeStamp
        Item item;  //it is the item structure instance // it calls nested struct
    }

    // this, willl actually help us to save the items in the bolckchain
    mapping(uint256 => Item) public items; //here, we are mapping the items in oreder of indexing
    mapping(address => uint256) public orderCount; //it stores "how much order placed by the address" (total no. of order by the address)
    mapping(address => mapping(uint256 => Order)) public orders; //and it sotres, the oreder details of an address(one address may have more than one oreder. so, we map the oreders according to the indexes) 



    event Listing(string name, uint256 cost, uint256 quantity);
    event Buy(address buyer, uint256 orderId, uint256 itemId);

// here, we create a function modifier which state that only "owner" can access
// and "onlyOwner" is used those function which needs to requie this statement
    modifier onlyOwner{
        require(msg.sender == owner);
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // List all the products
    function listingTheItem(
        uint256 _id,
        string memory _name,
        string memory _category,
        string memory _image,
        uint256 _cost,
        uint256 _rating,
        uint256 _stock
    ) public onlyOwner{
        // only owner can listing the product
        // require(msg.sender == owner, "Only owner can list any product");
        // here, we are use "onlyOwner" modifier so, we don't need the above line

        Item memory item = Item(
            _id,
            _name,
            _category,
            _image,
            _cost,
            _rating,
            _stock
        );

        // save the item into our "items" and we are mapped them with their cooresponding "_id"
        items[_id] = item;

        // here, we declear the event, means when the product is listed it will triggered everytime
        emit Listing(_name, _cost, _stock);
    }

    // Buy the products
    function buy(uint256 _id) public payable{
        // fetch the selected item by the help of "id"
        Item memory item = items[_id]; //to get a struct variable from mapping constract, we are create at first instance of that struct to sotre

        require(msg.value >= item.cost);
        require(item.stock > 0);
        // order an item
        // so, here we create an instance of the "Order" structure and assign it the values
        Order memory order = Order(block.timestamp, item);

        // now, save the order into the chain
        orderCount[msg.sender] += 1;  //at first the new sender who, never place order, it mapped like(sender.address => 1), and when second time placed then the value will increase by 1
        orders[msg.sender][orderCount[msg.sender]] = order; //here, orderCount[msg.sender] is return which number oreder placed by the buyer and map that sequencing number to the order details., and further these totals mapping are mapped with the buyer address

        // after placed an order, we need to reduce stock of that product 
        items[_id].stock = item.stock -1; 

        emit Buy(msg.sender, orderCount[msg.sender], item.id);
    }

    // withdraw funds
    function withdraw() public onlyOwner{
        // here, we use a new code for the transfer
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success);
    }
}

// one of address : 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512