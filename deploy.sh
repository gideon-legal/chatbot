#This is the deploy script in bash for the chatbot. 
#deploy.sh, is a shell script used for deploying the chatbot to different environments on AWS S3 and invalidating the associated CloudFront distribution.
#The script starts with a while loop that uses getopts to parse command-line options. In this case, it's looking for an option -m followed by a value. The value is stored in the MODE variable.
#After the while loop, it sets default values for DIST_ID (which seems to be a CloudFront distribution ID) and S3 (which appears to be the path of an S3 bucket).
#Then, it checks the MODE variable. If MODE is "production", it changes the S3 variable to a different path. If MODE is "chatbot-saas", it changes the S3 variable to the cc-saas path. 
#This allows the script to deploy to different S3 buckets based on the mode specified.
#Next, it runs npm run prepublish to build the code or assets. 
#This command is specific to your project and likely defined in your package.json file.
#After building the assets, it uses the AWS CLI command aws s3 sync to synchronize the local public directory with the specified S3 bucket. 
#The --acl public-read option sets the Access Control List to allow public read access. The --sse option enables server-side encryption, and the --delete option deletes files in the S3 bucket that are not present in the local public directory.
#Finally, it invalidates the CloudFront distribution associated with the DIST_ID using the aws cloudfront create-invalidation command. This ensures that the latest version of your application is served through CloudFront.

while getopts m: option
    do
    case "${option}"
        in
        m) MODE=${OPTARG};;
    esac
done

DIST_ID="E2EY31LM1DTKH1"
S3="com.gideon.chatbot.dev/development"

if [ "$MODE" == "production" ]
then
    S3="com.gideon.chatbot.dev/latest"
elif [ "$MODE" == "chatbot-saas" ]
then
    S3="com.gideon.chatbot.dev/catbot-saas"
fi

# build code / assets
npm run prepublish

# push to appropriate s3 bucket ( requires aws cli login, s3 permissions )
aws s3 sync --acl public-read --sse --delete public s3://$S3

# invalidate cloudfront distribution
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"