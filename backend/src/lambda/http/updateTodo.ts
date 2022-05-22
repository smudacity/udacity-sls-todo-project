import 'source-map-support/register'

import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import * as middy from 'middy'
import {cors, httpErrorHandler} from 'middy/middlewares'
import {updateTodo} from '../../businessLogic/todos'
import {UpdateTodoRequest} from '../../requests/UpdateTodoRequest'
import {getUserId} from '../utils'
import {createLogger} from "../../utils/logger";

const logger = createLogger('UpdateTodo - handler')
export const handler = middy(
    async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        const todoId = event.pathParameters.todoId
        const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
        // TODO: Update a TODO item with the provided id using values in the "updatedTodo" object
        logger.info(`updating todo id: ${todoId} with value ${JSON.stringify(updatedTodo)}`)
        const updated = updateTodo(todoId, updatedTodo, getUserId(event))
        if (!!updated) {
            return {
                statusCode: 200,
                body: ''
            }
        } else {
            return {
                statusCode: 404,
                body: 'Todo with the given id is not found'
            }
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
