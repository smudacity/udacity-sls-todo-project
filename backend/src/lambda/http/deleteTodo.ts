import 'source-map-support/register'

import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import * as middy from 'middy'
import {cors, httpErrorHandler} from 'middy/middlewares'
import {deleteTodo} from '../../businessLogic/todos'
import {getUserId} from '../utils'

export const handler = middy(
    async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        const todoId = event.pathParameters.todoId
        // TODO: Remove a TODO item by id
        console.log(todoId)
        // Call biz logic to delete.
        const deleted = await deleteTodo(todoId, getUserId(event))
        // If successful return 204
        // Since no body and successful
        if (deleted) {
            return {
                statusCode: 204,
                body: ''
            }
        }
        // If error throw 404 or 500
        return {
                statusCode: 404,
                body: ''
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
