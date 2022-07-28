const hre = require("hardhat");
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

    // describe("Add Liquidity", async () => {
    //     it("should add liquidity", async () => {
    //         await token.approve(exchange.address, toWei(200));
    //         await exchange.addLiquidity(toWei(200), { value: toWei(100) });

    //         expect(await getBalance(exchange.address)).to.equal(toWei(100));
    //         expect(await exchange.getReserve()).to.equal(toWei(200));
    //     });
    // });

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
            expect(fromWei(tokensBought)).to.eq("1.998001998001998001");

            tokensBought = await exchange.getTokenAmount(toWei(100));
            expect(fromWei(tokensBought)).to.eq("181.818181818181818181");

            tokensBought = await exchange.getTokenAmount(toWei(1000));
            expect(fromWei(tokensBought)).to.eq("1000.0");

        })
    })

    describe("Get Eth amount", async () => {
        it("should return right eth amount", async () => {
            await token.approve(exchange.address, toWei(2000));
            await exchange.addLiquidity(toWei(2000), { value: toWei(1000) });

            let ethBought = await exchange.getEthAmount(toWei(2)) //Passing in tokens to be sold
            expect(fromWei(ethBought)).to.eq("0.999000999000999");

            ethBought = await exchange.getEthAmount(toWei(100)) //Passing in tokens to be sold
            expect(fromWei(ethBought)).to.eq("47.619047619047619047");

            ethBought = await exchange.getEthAmount(toWei(2000)) //Passing in tokens to be sold
            expect(fromWei(ethBought)).to.eq("500.0");
        })
    })


})
