'use strict';

var _ = require('underscore');
var ip = require('ip');
var mergeCidrs = require('merge-cidrs');

var totalCollateralDamage = 0;
function generate(blacklist, whitelist, maxBlocks) {
    // Convert the blacklist to CIDRs.
    blacklist = _.map(blacklist, function(ipAddress) {
        return ipAddress + '/32';
    });

    // sort the blacklist. We do this so we only need to compare adjacent CIDR blocks in the list.
    blacklist.sort();

    // Expand each CIDR string into an `ip.cidrSubnet` object, which gives us the first and last IPs in the range.
    var cidrs = _.map(blacklist, function(ipAddress) {
        return ip.cidrSubnet(ipAddress);
    });

    // Compute the BlacklistHash, an object keyed by the long form of each IP in the blacklist (for fast lookup)
    var blacklistHash = {};
    _.each(blacklist, function(blacklistedIP) {
        blacklistHash[ip.toLong(blacklistedIP)] = 1;
    });

    // Compute the WhitelistHash, an object keyed by the long form of each IP address in the whitelist for fast lookup
    var whitelistHash = {};
    _.each(whitelist, function(whitelistedIP) {
        whitelistHash[ip.toLong(whitelistedIP)] = 1;
        // Make sure we do not have the same IP address on both the whitelist and blacklist
        if (blacklistHash[ip.toLong(whitelistedIP)]) {
            throw new Error('IP addresses cannot appear in both the whitelist and blacklist: ' + whitelistedIP);
        }
    });

    // Start combining blocks until we are under the limit.
    // TODO: If we can combine CIDRs without any collateral damage at all, we should probably do that, even
    // if we are under the limit to start with.
    while (cidrs.length > maxBlocks) {
        cidrs = findCombinationWithLowestCollateralDamage(cidrs, blacklistHash);
    }

    // Return a set of strings for the CIDR blocks.
    return _.map(cidrs, function(cidr) {
        // TODO: Compute the number of blacklisted ips here, and the number of collateral damage and return both.
        // TODO: Whitelist first-pass: Note if this CIDR affects any of the whitelisted IPs.
        var end = ip.toLong(cidr.broadcastAddress);
        var collateralDamage = 0;
        var blacklistedIPs = 0;
        var whitelistedIPs = 0;
        for (var i = ip.toLong(cidr.networkAddress); i <= end; i++) {
            if (blacklistHash[i]) {
                blacklistedIPs++;
            } else {
                collateralDamage++;
                if (whitelistHash[i]) {
                    whitelistedIPs++;
                }
            }
        }
        return {
            CIDR: cidr.networkAddress + '/' + cidr.subnetMaskLength,
            collateralDamage: collateralDamage,
            blacklistedIPs: blacklistedIPs,
            whitelistedIPs: whitelistedIPs
        };
    });
}

function findCombinationWithLowestCollateralDamage(cidrs, blacklistHash) {
    var damage = [];
    for (var i = 0; i < cidrs.length - 1; i++ ){
        // combine cidrs[i] and cidrs[i+1] and compute its collateral damage. Store in the array.
        // TODO: If the collateral damage hits one of the whitelist IPs, we should set damage to an
        // incredibly high number, which would allow us to detect situations where further merging is not
        // possible.
        damage.push(collateralDamage(mergeCidrs(cidrs[i], cidrs[i+1]), blacklistHash));
    }

    var min = damage[0]
    var minIndex = 0;
    for (var i = 1; i < damage.length; i++) {
        if (damage[i] < min) {
            minIndex = i;
            min = damage[i];
        }
    }

    // Keep track of total collateral damage.
    totalCollateralDamage += min;

    // Okay, now we want to return the list of cidrs, which includes merging cidrs[minIndex] and cidrs[minIndex+1]
    var retVal = [];
    for (var i = 0; i < cidrs.length; i++) {
        if (i === minIndex) {
            retVal.push(mergeCidrs(cidrs[i], cidrs[i+1]));
            // Skip ahead an extra one since we merged it
            i++;
        } else {
            retVal.push(cidrs[i]);
        }
    }

    return retVal;
}

function collateralDamage(cidr, blacklistHash) {
    var collateralDamage = 0;
    var start = ip.toLong(cidr.networkAddress);
    var end = ip.toLong(cidr.broadcastAddress);
    // Be smart about the collateral damage calculation.
    // If this CIDR contains a lot of IP addresses, it's faster to iterate the blacklistHash
    // and see how many are in the range.
    var blacklist = _.keys(blacklistHash);
    if (end - start > blacklist.length) {
        for (var i = 0; i < blacklist.length; i++) {
            if (blacklist[i] > start && blacklist[i] < end) {
                collateralDamage++;
            }
        }
    } else {
        for (var i = start; i < end; i++) {
            if (!blacklistHash[i]) {
                collateralDamage++;
            }
        }
    }
    return collateralDamage;
}

module.exports = generate;
