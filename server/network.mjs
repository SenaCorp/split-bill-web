import dns from 'node:dns';

// Prefer IPv4 for outbound server requests. Some deployment hosts have broken or
// firewalled IPv6 egress; Node's fetch may try the IPv6 address first and fail
// with an unhelpful "TypeError: fetch failed" before falling back.
dns.setDefaultResultOrder('ipv4first');

export const getFetchFailureMessage = (error) => {
  const cause = error?.cause;
  const details = [cause?.code, cause?.message].filter(Boolean).join(': ');
  return details || error?.message || 'Unknown network error';
};

export const serverFetch = async (url, options) => {
  try {
    return await fetch(url, options);
  } catch (error) {
    const target = typeof url === 'string' ? url : url?.url || 'remote service';
    throw new Error(`Network request to ${target} failed (${getFetchFailureMessage(error)})`, { cause: error });
  }
};
