export type Address = string & { readonly __brand: 'Address' };

export function toAddress(s: string) : Address {
    if (!/^0x[0-9a-fA-F]{40}$/.test(s)) throw new Error('invalid address');
    return s as Address;
}