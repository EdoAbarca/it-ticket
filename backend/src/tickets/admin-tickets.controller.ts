import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  ValidationPipe,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { TicketsService } from '../tickets/tickets.service';
import { UpdateTicketStatusDto } from '../tickets/dto/update-ticket-status.dto';
import { UpdateTicketDto } from '../tickets/dto/update-ticket.dto';
import { GetTicketsQueryDto } from '../tickets/dto/get-tickets-query.dto';
import { CreateCommentDto } from '../tickets/dto/create-comment.dto';
import { UpdateCommentDto } from '../tickets/dto/update-comment.dto';

@Controller('admin/tickets')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  findAllTickets(
    @Query(new ValidationPipe({ transform: true })) query: GetTicketsQueryDto,
  ) {
    return this.ticketsService.findAllTickets(query);
  }

  @Get(':id')
  async findTicketById(@Param('id') id: string) {
    const ticket = await this.ticketsService.findTicketById(id);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  @Patch(':id/status')
  updateTicketStatus(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true }))
    updateStatusDto: UpdateTicketStatusDto,
    @Request() req: { user: { id: string } },
  ) {
    const adminId = req.user.id;
    return this.ticketsService.updateTicketStatus(
      id,
      updateStatusDto.status,
      adminId,
    );
  }

  @Get(':id/history')
  getTicketStatusHistory(@Param('id') id: string) {
    return this.ticketsService.getTicketStatusHistory(id);
  }

  @Post(':id/comments')
  createComment(
    @Param('id') ticketId: string,
    @Body(new ValidationPipe({ whitelist: true }))
    createCommentDto: CreateCommentDto,
    @Request() req: { user: { id: string } },
  ) {
    const adminId = req.user.id;
    return this.ticketsService.createAdminComment(
      ticketId,
      createCommentDto.content,
      adminId,
    );
  }

  @Get(':id/comments')
  getComments(@Param('id') ticketId: string) {
    return this.ticketsService.getAdminComments(ticketId);
  }

  @Patch(':id')
  updateTicket(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true }))
    updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.updateTicket(id, updateTicketDto);
  }

  @Delete(':id')
  deleteTicket(@Param('id') id: string) {
    return this.ticketsService.deleteTicket(id);
  }

  // Comment management endpoints
  @Patch('comments/:commentId')
  updateComment(
    @Param('commentId') commentId: string,
    @Body(new ValidationPipe({ whitelist: true }))
    updateCommentDto: UpdateCommentDto,
  ) {
    return this.ticketsService.updateComment(
      commentId,
      updateCommentDto.content,
    );
  }

  @Delete('comments/:commentId')
  deleteComment(@Param('commentId') commentId: string) {
    return this.ticketsService.deleteComment(commentId);
  }
}
