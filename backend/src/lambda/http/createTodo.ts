import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import {cors, httpErrorHandler} from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createTodo } from '../../businessLogic/todos'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
      const newTodo: CreateTodoRequest = JSON.parse(event.body)
      // TODO: Implement creating a new TODO itemnewTodo.done = false;
    const newTodoItem = await createTodo(newTodo, getUserId(event))

    console.log(event)

    return {
            statusCode: 201,
            body: JSON.stringify( newTodoItem)
      }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
    .use(httpErrorHandler())

