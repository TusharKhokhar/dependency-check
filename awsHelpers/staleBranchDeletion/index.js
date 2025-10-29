const { CodeCommitClient, ListBranchesCommand, GetBranchCommand, GetCommitCommand, DeleteBranchCommand } = require('@aws-sdk/client-codecommit');
const { fromIni } = require('@aws-sdk/credential-providers');

// Create CodeCommit client
const client = new CodeCommitClient({
    region: 'your-region', // e.g., 'us-west-2'
    credentials: fromIni({ profile: 'your-aws-profile' }) // Replace with your AWS profile
});

const repositoryName = 'your-repo-name';

async function deleteOldBranches() {
    try {
        // List all branches
        const listBranchesCommand = new ListBranchesCommand({ repositoryName });
        const branchesData = await client.send(listBranchesCommand);
        const branches = branchesData.branches;

        const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        // Iterate over branches to check commit dates
        for (const branch of branches) {
            // Get branch details to find the last commit ID
            const getBranchCommand = new GetBranchCommand({ repositoryName, branchName: branch });
            const branchData = await client.send(getBranchCommand);
            const commitId = branchData.branch.commitId;

            // Get commit details to find the commit date
            const getCommitCommand = new GetCommitCommand({ repositoryName, commitId });
            const commitData = await client.send(getCommitCommand);
            const commitDate = new Date(commitData.commit.committer.date).getTime();

            // Calculate the age of the branch
            const age = now - commitDate;

            // If the branch is older than 30 days, delete it
            if (age > THIRTY_DAYS_IN_MS && branch !== 'main' && branch !== 'master') {
                const deleteBranchCommand = new DeleteBranchCommand({ repositoryName, branchName: branch });
                await client.send(deleteBranchCommand);
                console.log(`Deleted branch: ${branch}`);
            }
        }

        console.log('Old branches deletion completed.');
    } catch (error) {
        console.error('Error deleting branches:', error);
    }
}

// Execute the function
deleteOldBranches();
