var cidrGenerator = require('../lib/index.js');
describe('CIDR-Generator', function() {
    it('returns a single /32 CIDR when given a single IP address', function() {
        var ips = ['127.0.0.1'];
        var cidrs = cidrGenerator(ips, null, 1);
        expect(cidrs.length).toBe(1);
        expect(cidrs[0].CIDR).toBe('127.0.0.1/32');
        expect(cidrs[0].blacklistedIPs).toBe(1);
        expect(cidrs[0].whitelistedIPs).toBe(0);
        expect(cidrs[0].collateralDamage).toBe(0);
    });

    it('returns a /30 CIDR when given a list of IP addresses', function() {
        var ips = [
            // contiguous block
            '127.0.0.0',
            '127.0.0.1',
            '127.0.0.2',
            '127.0.0.3'
        ];
        var cidrs = cidrGenerator(ips, null, 1);
        expect(cidrs.length).toBe(1);
        expect(cidrs[0].CIDR).toBe('127.0.0.0/30');
        expect(cidrs[0].blacklistedIPs).toBe(4);
        expect(cidrs[0].whitelistedIPs).toBe(0);
        expect(cidrs[0].collateralDamage).toBe(0);
    });

    it('returns four /32 CIDRs when given a list of four IP addresses and four resulting blocks', function() {
        var ips = [
            // contiguous block
            '127.0.0.0',
            '127.0.0.1',
            '127.0.0.2',
            '127.0.0.3'
        ];
        var cidrs = cidrGenerator(ips, null, 4);
        expect(cidrs.length).toBe(4);
        expect(cidrs[0].CIDR).toBe('127.0.0.0/32');
        expect(cidrs[0].blacklistedIPs).toBe(1);
        expect(cidrs[0].whitelistedIPs).toBe(0);
        expect(cidrs[0].collateralDamage).toBe(0);
        expect(cidrs[1].CIDR).toBe('127.0.0.1/32');
        expect(cidrs[1].blacklistedIPs).toBe(1);
        expect(cidrs[1].whitelistedIPs).toBe(0);
        expect(cidrs[1].collateralDamage).toBe(0);
        expect(cidrs[2].CIDR).toBe('127.0.0.2/32');
        expect(cidrs[2].blacklistedIPs).toBe(1);
        expect(cidrs[2].whitelistedIPs).toBe(0);
        expect(cidrs[2].collateralDamage).toBe(0);
        expect(cidrs[3].CIDR).toBe('127.0.0.3/32');
        expect(cidrs[3].blacklistedIPs).toBe(1);
        expect(cidrs[3].whitelistedIPs).toBe(0);
        expect(cidrs[3].collateralDamage).toBe(0);
    });

    it('returns a /30 CIDR when given a list of IP addresses even though the IPs do not fully cover the space', function() {
        var ips = [
            // non-contiguous block
            '127.0.0.0',
            '127.0.0.2'
        ];
        var cidrs = cidrGenerator(ips, null, 1);
        expect(cidrs.length).toBe(1);
        expect(cidrs[0].CIDR).toBe('127.0.0.0/30');
        expect(cidrs[0].blacklistedIPs).toBe(2);
        expect(cidrs[0].whitelistedIPs).toBe(0);
        expect(cidrs[0].collateralDamage).toBe(2);
    });

    it('Correctly computes the whitelist', function() {
        var ips = [
            // non-contiguous block
            '127.0.0.0',
            '127.0.0.2'
        ];
        var cidrs = cidrGenerator(ips, ['127.0.0.1'], 1);
        expect(cidrs[0].CIDR).toBe('127.0.0.0/30');
        expect(cidrs[0].blacklistedIPs).toBe(2);
        expect(cidrs[0].whitelistedIPs).toBe(1);
        expect(cidrs[0].collateralDamage).toBe(2);
    });

    it('throws an exception when the same IP appears in both the whitelist and blacklist', function() {
        var ips = [
            '127.0.0.1',
            '127.0.0.2'
        ];
        expect(function() {cidrGenerator(ips, ['127.0.0.1'], 1);}).toThrow();
    });
});
