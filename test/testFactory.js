const { expect } = require("chai");
const { ethers } = require("hardhat");

const toWei = (value) => ethers.utils.parseEther(value.toString());

const fromWei = (value) =>
    ethers.utils.formatEther(
        typeof value === "string" ? value : value.toString()
    );

const createExchange = async (factory, tokenAddress, sender) => {
    var exchangeAddress = await factory.connect(sender).callStatic.createExchange(
        tokenAddress
    );
    await factory.connect(sender).createExchange(tokenAddress);
    const Exchange = await ethers.getContractFactory("Exchange");
    return await Exchange.attach(exchangeAddress);
}

describe("Factory", () => {
    let owner;
    let user;
    let factory;
    let token1;
    let token2;


    beforeEach(async () => {
        [owner, user] = await ethers.getSigners();
    })


    describe("Create Exchanges", async () => {
        it("deploys an exchange", async () => {
            const Factory = await ethers.getContractFactory("Factory");
            factory = await Factory.deploy();
            await factory.deployed();

            const Token = await ethers.getContractFactory("Token");
            token1 = await Token.deploy("Apple", "apple", toWei(10 ** 6));
            await token1.deployed();

            token2 = await Token.deploy("Mango", "mango", toWei(10 ** 6));
            await token2.deployed();
        })

        it("Adding liquidity into both exchanges for trades", async () => {

            const exchange_1 = await createExchange(factory, token1.address, owner);
            const exchange_2 = await createExchange(factory, token2.address, owner);

            await token1.approve(exchange_1.address, toWei(2000));
            await exchange_1.addLiquidity(toWei(2000), { value: toWei(1000) });

            await token2.approve(exchange_2.address, toWei(2000));
            await exchange_2.addLiquidity(toWei(2000), { value: toWei(1000) });

            await token1.transfer(user.address, toWei(200));
            await token1.connect(user).approve(exchange_1.address, toWei(200));

            await exchange_1.connect(user).tokenToTokenSwap(toWei(200), toWei(1), token2.address);

            expect(fromWei(await token2.balanceOf(user.address))).to.eq("163.758030425810979022");
            expect(fromWei(await exchange_2.getReserve())).to.eq("1836.241969574189020978");
        })
    })

})