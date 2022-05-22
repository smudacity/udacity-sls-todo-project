import {TodosDBAccess} from '../dataLayer/TodosDBAccess'
//import { AttachmentUtils } from './attachmentUtils';
import {TodoItem} from '../models/TodoItem'


import {CreateTodoRequest} from '../requests/CreateTodoRequest'
//import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as uuid from 'uuid'
import {createLogger} from "../utils/logger";
import {UpdateTodoRequest} from "../requests/UpdateTodoRequest";

const todosDBAccess = new TodosDBAccess()
const logger = createLogger('todos.ts')

// TODO: Implement businessLogic


export function getTodosForUser(userId: string): Promise<TodoItem[]> {
    return new TodosDBAccess().getTodosForUser(userId)
}

export async function createTodo(
    todoFromClient: CreateTodoRequest,
    userId: string): Promise<TodoItem> {

    const todoId = uuid.v4()
    const newItem = await createTodoItem(todoId, userId, todoFromClient)

    return todosDBAccess.createTodo(newItem)
}

function createTodoItem(todoId: string, userId: string, todoFromClient: CreateTodoRequest) {

    return {
        todoId,
        userId,
        createdAt: new Date().toISOString(),
        done: false,
        attachmentUrl: todosDBAccess.getAttachmentUrlToView(todoId),
        ...todoFromClient
    }
}

export function createAttachmentPresignedUrl(todoId: string) {
    return todosDBAccess.getUploadUrl(todoId)
}

export async function deleteTodo(todoId: string, userId: string): Promise<boolean> {
    //Delete Todo item with todoID and userId by calling Data layer
    logger.info(`Delete initiated todoId: ${todoId} and userId: ${userId}`)
    const deletedTodo = await todosDBAccess.deleteTodo(todoId, userId)
    if (!!deletedTodo) {
        logger.info(`Delete TODO for todo: ${todoId} successful. Now delete attachment too `)
        await todosDBAccess.deleteAttachment(todoId)
        logger.info(`Delete attachment for todo: ${todoId} successful`)
        return true
    }

}

export async function updateTodo(todoId: string, updatedTodo: UpdateTodoRequest, userId: string) {
    const todoById = await todosDBAccess.getTodoById(userId, todoId)
    if (!!todoById && todoById.Item) {
        const currentTodo = todoById.Item as TodoItem
        if (!!currentTodo && userId === currentTodo.userId) {
            currentTodo.dueDate = updatedTodo.dueDate
            currentTodo.done = updatedTodo.done
            currentTodo.name = updatedTodo.name

            const updated = await todosDBAccess.updateTodo(currentTodo)
            logger.info(`Updated the todo item with new name : ${currentTodo.name}`)
            return updated
        }
    } else {
        return null;
    }


}
