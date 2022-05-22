import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import {  getTodosForUser } from '../../businessLogic/todos'
import { getUserId } from '../utils';
import {createLogger} from "../../utils/logger";
const logger = createLogger('getTodos')


// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
      // Write your code here

      const todos = await getTodosForUser(getUserId(event))
      logger.log('info', 'todos received')

      return {
          statusCode: 200,
          headers: {
              'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({
              todos
          })
      }
  })

handler
    .use(httpErrorHandler())
    .use(cors({
    credentials: true
  })
)
