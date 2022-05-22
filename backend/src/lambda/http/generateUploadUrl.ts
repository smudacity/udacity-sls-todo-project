import 'source-map-support/register'

import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import * as middy from 'middy'
import {cors, httpErrorHandler} from 'middy/middlewares'
import {createAttachmentPresignedUrl} from '../../businessLogic/todos'

export const handler = middy(
    async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        const todoId = event.pathParameters.todoId
        // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
        const generatedUploadURL = createAttachmentPresignedUrl(todoId)
        console.log(`Generated and returning presigned URL for attaching to todoId: ${todoId}`)

        return {
            statusCode: 200,
            body: JSON.stringify(generatedUploadURL)
        }
    }
)

handler
    .use(httpErrorHandler())
    .use(
        cors({
            credentials: true
        })
    )
