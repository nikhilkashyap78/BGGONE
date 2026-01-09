# SPF DNS Record Recommendation for BGGONE

To improve email deliverability and security, you should configure an SPF (Sender Policy Framework) record in your domain's DNS settings.

> [!IMPORTANT]
> **DNS Configuration Required**: This change must be made at your DNS provider (e.g., GoDaddy, Namecheap, Cloudflare), not in the application code.

### Recommended SPF Record

If you are using Google Workspace (Gmail) for your domain emails:

```text
v=spf1 include:_spf.google.com ~all
```

If you are using another provider, please consult their documentation to get the correct `include` value.

### Why is this important?
1. **Security**: Prevents attackers from spoofing your domain.
2. **Deliverability**: Ensures your legitimate emails don't end up in spam folders.
3. **SEO & Reputation**: Search engines and email providers favor domains with proper security configurations.
