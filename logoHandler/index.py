import base64
import boto3


s3 = boto3.client('s3')

def lambda_handler(event, context):
    print('event*****',event)
    base64_str = event ["queryStringParameters"]["image"]
    path = 'Logos' + base64.b64decode(base64_str).decode('utf-8')
    bucket_name = event ["pathParameters"]["source"]
    fileObj = s3.get_object(Bucket=bucket_name, Key=path)
    file_content = fileObj["Body"].read()
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": fileObj["ContentType"]
        },
        "body": base64.b64encode(file_content),
        "isBase64Encoded": True
    }
