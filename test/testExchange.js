const { expect } = require("chai");
const { ethers } = require("hardhat");


const toWei = (value) => ethers.utils.parseEther(value.toString());

const fromWei = (value) =>
    ethers.utils.formatEther(
        typeof value === "string" ? value : value.toString()
    );

const getBalance = ethers.provider.getBalance;

describe("Exchange", () => {
    let owner;
    let user;
    let exchange;
    let token;

    beforeEach(async () => {
        [owner, user] = await ethers.getSigners();
        const Token = await ethers.getContractFactory("Token");
        token = await Token.deploy("Apple", "apple", toWei(10 ** 6));
        await token.deployed();

        const Exchange = await ethers.getContractFactory("Exchange");
        exchange = await Exchange.deploy(token.address);
        await exchange.deployed();
    })

    it("is deployed", async () => {
        expect(await exchange.deployed()).to.equal(exchange);
    });

    describe("Get Price", async () => {
        it("should return correct prices", async () => {
            await token.approve(exchange.address, toWei(2000));
            await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });

            const ethReserve = await getBalance(exchange.address); //100
            const tokenReserve = await exchange.getReserve(); //200

            expect(await exchange.getPrices(tokenReserve, ethReserve)).to.equal(2000);
            expect(await exchange.getPrices(ethReserve, tokenReserve)).to.equal(500);
        });
    });

    describe("Get Token amount", async () => {
        it("should return right token amount", async () => {
            await token.approve(exchange.address, toWei(2000));
            await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });

            let tokensBought = await exchange.getTokenAmount(toWei(1)); //Passing in eth to be sold
            expect(fromWei(tokensBought)).to.eq("1.978041738678708079");

            tokensBought = await exchange.getTokenAmount(toWei(100));
            expect(fromWei(tokensBought)).to.eq("180.1637852593266606");

            tokensBought = await exchange.getTokenAmount(toWei(1000));
            expect(fromWei(tokensBought)).to.eq("994.974874371859296482");

        })
    })

    describe("Get Eth amount", async () => {
        it("should return right eth amount", async () => {
            await token.approve(exchange.address, toWei(2000));
            await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });

            let ethBought = await exchange.getEthAmount(toWei(2)) //Passing in tokens to be sold
            expect(fromWei(ethBought)).to.eq("0.989020869339354039");

            ethBought = await exchange.getEthAmount(toWei(100)) //Passing in tokens to be sold
            expect(fromWei(ethBought)).to.eq("47.16531681753215817");

            ethBought = await exchange.getEthAmount(toWei(2000)) //Passing in tokens to be sold
            expect(fromWei(ethBought)).to.eq("497.487437185929648241");
        })
    })

    describe("Check all functions together", async () => {
        it("should work correctly", async () => {

            var balanceOwner = await token.balanceOf(owner.address);
            console.log("balanceOwner: ", fromWei(balanceOwner));

            await token.transfer(user.address, toWei(200));

            var balanceUser = await token.balanceOf(user.address);
            console.log("balanceUser: ", fromWei(balanceUser));

            await token.connect(user).approve(exchange.address, toWei(200));
            await exchange.connect(user).addLiquidity(toWei(200), { value: toWei(100) });

            await exchange.connect(user).ethToTokenSwap(toWei(1), { value: toWei(10) });

            const tokensBought = await token.balanceOf(user.address);
            expect(fromWei(tokensBought)).to.eq("18.01637852593266606");

            const LPtokens = await exchange.balanceOf(user.address);
            console.log("LPtokens", fromWei(LPtokens));

            const txn = await exchange.connect(user).removeLiquidity(toWei(100));
            let receipt = await txn.wait();
            receipt.events?.filter((x) => {
                if (x.event == "RemoveLiquidity") {
                    console.log("LP tokens: ", fromWei(x.args.lptokensBurned));
                    console.log("ETH Returned: ", fromWei(x.args.ethReturned));
                    console.log("Token Returned: ", fromWei(x.args.tokensReturned));
                }
            });
        })
    })
})
