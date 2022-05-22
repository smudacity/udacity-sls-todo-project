import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

import { TodoItem } from '../models/TodoItem'
import {createLogger} from "../utils/logger";


const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

const attachmentBucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION


const logger = createLogger('TodosDBAccess')

// TODO: Implement the dataLayer logic

export class TodosDBAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todoTable = process.env.TODOS_TABLE) {
  }

  async getTodosForUser(userId: string): Promise<TodoItem[]> {
    console.log('Getting all todo items')
    logger.log('info', 'Getting all todo items')

    const result = await this.docClient.query({
      TableName: this.todoTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false
    }).promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    logger.info(`Writing  ${todoItem.name}  TODO to db...`)

    await this.docClient.put({
      TableName: this.todoTable,
      Item: todoItem
    }).promise()

    logger.info('Write TODO to db is successful.')

    return todoItem
  }

  getAttachmentUrlToView(todoId: string) {
    return `https://${attachmentBucketName}.s3.amazonaws.com/${todoId}`
  }


  getUploadUrl(todoId: string) {
    return s3.getSignedUrl('putObject', {
      Bucket: attachmentBucketName,
      Key: todoId,
      Expires: parseInt(urlExpiration)
    })
  }

  async deleteTodo(todoId: string, userId: string) {
   try{
     const deletedNode = await this.docClient.delete({
       TableName: this.todoTable,
       Key: {
         userId,
         todoId
       }
     }).promise()
     return deletedNode
   }catch(e: any){
     logger.error(`Error deleting todoid: ${todoId}`)
     return null
   }

  }

  async deleteAttachment(todoId: string) {
    await s3.deleteObject({
      Bucket: attachmentBucketName,
      Key: todoId
    }).promise()
  }

  async getTodoById(userId: string, todoId: string) {
    return await this.docClient.get({
      TableName: this.todoTable,
      Key: {
        userId,
        todoId
      }
    }).promise()
  }

  async updateTodo(currentTodo: TodoItem) {
    await this.docClient.update({
      TableName: this.todoTable,
      Key: {
        userId: currentTodo.userId,
        todoId: currentTodo.todoId
      },
      UpdateExpression: 'set #name = :name, #dueDate = :dueDate, #done = :done',
      ExpressionAttributeNames: {
        "#name": "name",
        "#dueDate": "dueDate",
        "#done": "done"
      },
      ExpressionAttributeValues: {
        ":name": currentTodo.name,
        ":dueDate": currentTodo.dueDate,
        ":done": currentTodo.done
      }
    }).promise()
  }
}


function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new AWS.DynamoDB.DocumentClient()
}
