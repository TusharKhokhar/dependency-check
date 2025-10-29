const { EC2Client, DescribeInstancesCommand, StopInstancesCommand } = require('@aws-sdk/client-ec2');

const ec2Client = new EC2Client();

exports.handler = async (event) => {
    try {
        // Describe all instances
        const data = await ec2Client.send(new DescribeInstancesCommand({}));
        const instances = data.Reservations.reduce((acc, reservation) => {
            return acc.concat(reservation.Instances.map(instance => instance.InstanceId));
        }, []);

        // Stop instances
        if (instances.length > 0) {
            await ec2Client.send(new StopInstancesCommand({ InstanceIds: instances }));
            console.log(`Stopped instances: ${instances.join(', ')}`);
        } else {
            console.log('No instances to stop.');
        }
    } catch (error) {
        console.error(error);
    }
};
