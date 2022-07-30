const { expect } = require("chai");
const { ethers } = require("hardhat");

const toWei = (value) => ethers.utils.parseEther(value.toString());

const fromWei = (value) =>
    ethers.utils.formatEther(
        typeof value === "string" ? value : value.toString()
    );

describe("Factory", () => {
    let owner;
    let user;
    let factory;
    let token1;
    let token2;
    let exchangeAddress_1;
    let exchangeAddress_2;

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

            console.log("token1::: ", token1.address);
            console.log("token2::: ", token2.address);

            exchangeAddress_1 = await factory.callStatic.createExchange(
                token1.address
            );
            console.log("exchangeAddress1: ", exchangeAddress_1);
            await factory.createExchange(token1.address);
            expect(await factory.tokenToExchange(token1.address)).to.eq(exchangeAddress_1);

            exchangeAddress_2 = await factory.callStatic.createExchange(
                token2.address
            );
            console.log("exchangeAddress2: ", exchangeAddress_2);
            await factory.createExchange(token2.address);
            expect(await factory.tokenToExchange(token2.address)).to.eq(exchangeAddress_2);
        })

        it("Adding liquidity into both exchanges for trades", async () => {

            const Exchange = await ethers.getContractFactory("Exchange");
            const exchange_1 = await Exchange.attach(exchangeAddress_1);
            const exchange_2 = await Exchange.attach(exchangeAddress_2);

            console.log("Token 1 address: ", token1.address);
            console.log("Token 2 address: ", token2.address);
            console.log("Exchange 1 address: ", exchange_1.address);
            console.log("Exchange 2 address: ", exchange_2.address);

            await token1.approve(exchange_1.address, toWei(2000));
            await exchange_1.addLiquidity(toWei(2000), { value: toWei(1000) });

            await token2.approve(exchangeAddress_2, toWei(2000));
            await exchange_2.addLiquidity(toWei(2000), { value: toWei(1000) });

            await token1.transfer(user.address, toWei(200));
            await token1.connect(user).approve(exchangeAddress_1, toWei(200));

            await exchange_1.connect(user).tokenToTokenSwap(toWei(200), toWei(1), token2.address);

            const bal_Token1_User = await token1.balanceOf(user.address);
            const bal_Token2_User = await token2.balanceOf(user.address);

            console.log("Token 2 balance in reserve:", fromWei(await exchange_2.getReserve()))
            console.log("bal_Token1_User: ", bal_Token1_User);
            console.log("bal_Token2_User: ", fromWei(bal_Token2_User));

        })
    })

})