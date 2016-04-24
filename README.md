# CIDR-Generator

Given a list of IP addresses to blacklist and a maximum number of CIDR blocks to use, return a set of CIDR blocks
covering the blacklist with minimal collateral damage (non-blacklisted IP addresses which fall into the CIDR blocks returned).

This is ideal for generating CIDR-based blacklist rulesets to block malicious traffic originating from particular IP addresses where
the total number of CIDRs in the ruleset is limited (eg, [AWS VPC ACLs](http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/VPC_ACLs.html) allow only 20 rules) while minimizing the impact to non-malicious IP addresses.

In future versions of this package the CIDR block generation logic will avoid the whitelisted IP addresses; in the current version however it simply reports how many whitelisted IP addresses fall into each returned CIDR block.

Install with:

    npm install CIDR-Generator

## Usage
### Parameters
`blacklist` - An _array_ of IPv4-formatted IP address _strings_ which will be covered by the resulting CIDR blocks.
`whitelist` - An _array_ of IPv4-formatted IP address _strings_ which should not be covered by the CIDR blocks.
`maxBlocks` - The maximum number of CIDR blocks to return.
### Return Value
An _array_ of objects whose length will be `maxBlocks` or less. Each object will contain the following fields:
`CIDR` - a _string_ representing a CIDR block (eg, `127.0.0.0/30`)
`blacklistedIPs` - the _number_ of IP addresses from the blacklist covered by the CIDR block.
`whitelistedIPs` - the _number_ of IP addresses from the whitelist covered by the CIDR block.
`collateralDamage` - the _number_ of IP addresses in the CIDR block that are *not* in the blacklist. (This quantity includes IP addresses appearing on the whitelist.)
### Examples
```js
var generator = require('CIDR-Generator');

// Example where you have a set of IPs to blacklist using only a single CIDR block:
var ips = [
    // contiguous block
    '127.0.0.0',
    '127.0.0.1',
    '127.0.0.2',
    '127.0.0.3'
];
var cidrs = generator(ips, null, 1);
console.log('Blocking: ' + cidrs[0].CIDR);

// Example where you have a set of IPs to blacklist using three CIDR blocks:
cidrs = generator(ips, null, 3);
console.log('Blocking: ' + cidrs[0].CIDR);
console.log('Blocking: ' + cidrs[1].CIDR);
console.log('Blocking: ' + cidrs[2].CIDR);
```
