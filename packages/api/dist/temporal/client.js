import { Connection, Client } from '@temporalio/client';
export const getTemporalClient = async () => {
    const connection = await Connection.connect({
        address: 'temporal:7233',
    });
    return new Client({
        connection,
        namespace: 'default',
    });
};
