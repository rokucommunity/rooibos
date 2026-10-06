import type { DeviceConfig } from 'roku-deploy';

/**
 * Work out which Roku the CLI should talk to: a LAN device (host) or a Roku Cloud
 * Emulator (esn / instance url plus a token). Throws an Error with a user-friendly
 * message when the inputs are missing or contradictory. Neither the token nor any
 * message built here ever contains the token value.
 */
export function resolveCliDevice(argv: CliDeviceArguments, bsConfig: { host?: string }, env: NodeJS.ProcessEnv): ResolvedCliDevice {
    const host = readSingleValue('--host', argv.host);
    const esn = readSingleValue('--esn', argv.esn);
    const instanceUrl = readSingleValue('--instance-url', argv.instanceUrl);
    const token = readSingleValue('--token', argv.token, true) || undefined;

    for (const [flag, value] of [['--host', host], ['--esn', esn], ['--instance-url', instanceUrl]]) {
        if (value === '') {
            throw new Error(`${flag} was given an empty value.`);
        }
    }

    const specifiedFlags = [
        host !== undefined ? '--host' : undefined,
        esn !== undefined ? '--esn' : undefined,
        instanceUrl !== undefined ? '--instance-url' : undefined
    ].filter(Boolean);
    if (specifiedFlags.length > 1) {
        throw new Error(`Specify only one of --host, --esn or --instance-url (received ${specifiedFlags.join(' and ')}).`);
    }

    if (esn || instanceUrl) {
        const rceToken = token ?? (env.ROKU_RCE_TOKEN || undefined);
        if (!rceToken) {
            throw new Error('Roku Cloud Emulator targets need a token. (--token, or ROKU_RCE_TOKEN in .env)');
        }
        if (esn) {
            return { device: { esn: esn, rceToken: rceToken }, label: `RCE device ${esn}` };
        }
        return { device: { instanceUrl: instanceUrl, rceToken: rceToken }, label: `RCE instance ${instanceUrl}` };
    }

    const resolvedHost = host ?? bsConfig.host ?? env.ROKU_HOST;
    if (!resolvedHost) {
        throw new Error('You must provide a target device. (--host, or ROKU_HOST in .env; or for a Roku Cloud Emulator, --esn or --instance-url with --token or ROKU_RCE_TOKEN)');
    }
    if (token) {
        throw new Error('--token only applies with --esn or --instance-url, not with a --host.');
    }
    return { device: { host: resolvedHost }, label: resolvedHost };
}

function readSingleValue(flag: string, value: unknown, allowEmpty = false): string | undefined {
    if (Array.isArray(value)) {
        throw new Error(`${flag} was specified more than once.`);
    }
    if (value === undefined || (allowEmpty && value === '')) {
        return allowEmpty ? (value as string) : undefined;
    }
    return String(value);
}

export interface CliDeviceArguments {
    host?: string;
    esn?: string;
    instanceUrl?: string;
    token?: string;
}

export interface ResolvedCliDevice {
    device: DeviceConfig;
    /** Log-safe description of the target; never includes the token. */
    label: string;
}
