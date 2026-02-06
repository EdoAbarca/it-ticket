# Application Monitoring Guide

This document provides comprehensive information about the application monitoring features implemented for the IT Ticket Management System.

## Overview

The monitoring system provides DevOps engineers with tools to:
- Monitor application health and status
- Track application performance metrics
- Access structured request/response logs
- Ensure system reliability and troubleshoot issues

## Features

### 1. Health Checks

The health check endpoint provides comprehensive status information about the application and its dependencies.

**Endpoint:** `GET /monitoring/health`

**Access:** Public (no authentication required)

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-30T16:11:14.954Z",
  "uptime": 3600,
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 10
    },
    "memory": {
      "status": "healthy",
      "used": 50000000,
      "total": 100000000,
      "percentage": 50.0
    }
  }
}
```

**Health Status:**
- `healthy`: All systems operational
- `unhealthy`: One or more critical systems failing

**Monitored Components:**
- **Database**: Connection status and response time
- **Memory**: Current memory usage and percentage

### 2. Application Metrics

The metrics endpoint provides detailed performance and resource utilization data.

**Endpoint:** `GET /monitoring/metrics`

**Access:** Admin only (requires JWT authentication)

**Response:**
```json
{
  "timestamp": "2025-10-30T16:11:14.954Z",
  "uptime": 3600,
  "memory": {
    "heapUsed": 50000000,
    "heapTotal": 100000000,
    "rss": 150000000,
    "external": 5000000
  },
  "process": {
    "cpuUsage": {
      "user": 500000,
      "system": 200000
    },
    "pid": 1234
  }
}
```

**Metrics Description:**
- **uptime**: Application uptime in seconds
- **memory.heapUsed**: JavaScript heap memory used (bytes)
- **memory.heapTotal**: Total JavaScript heap memory (bytes)
- **memory.rss**: Resident Set Size - total memory allocated (bytes)
- **memory.external**: Memory used by C++ objects bound to JavaScript (bytes)
- **process.cpuUsage.user**: User CPU time (microseconds)
- **process.cpuUsage.system**: System CPU time (microseconds)
- **process.pid**: Process ID

### 3. Request Logging

The application automatically logs all HTTP requests and responses with structured data.

**Logged Information:**
- Request method, URL, IP address, and user agent
- Response status code and time
- Request duration
- Error details (for failed requests)

**Log Format:**
```
[HTTP] Incoming request { method: 'GET', url: '/api/tickets', ip: '127.0.0.1', userAgent: 'Mozilla/5.0...' }
[HTTP] Request completed { method: 'GET', url: '/api/tickets', statusCode: 200, responseTime: '45ms' }
```

**Error Logging:**
```
[HTTP] Request failed { method: 'POST', url: '/api/tickets', error: 'Validation failed', stack: '...', responseTime: '12ms' }
```

### 4. Log Access Endpoint

Access application logs programmatically.

**Endpoint:** `GET /monitoring/logs`

**Access:** Admin only (requires JWT authentication)

**Query Parameters:**
- `limit`: Maximum number of log entries to return (default: 100)
- `level`: Filter by log level (e.g., 'error', 'warn', 'info')

**Example:**
```bash
GET /monitoring/logs?limit=50&level=error
```

**Note:** Currently returns an empty array. In production, integrate with a proper logging service like Winston, Pino, or external services like Datadog, New Relic, or ELK Stack.

## Integration with Docker

### Health Check Configuration

The Docker Compose configuration uses the health endpoint for container health checks:

```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

This ensures:
- Containers restart automatically if unhealthy
- Dependent services wait for backend to be healthy
- Load balancers can route traffic only to healthy instances

## Monitoring Best Practices

### 1. Health Check Monitoring

Set up external monitoring to periodically check the `/monitoring/health` endpoint:

```bash
# Example with curl
curl http://your-api.com/monitoring/health

# Example with monitoring service
# Configure Pingdom, UptimeRobot, or similar to monitor the endpoint
```

### 2. Metrics Collection

Regularly collect metrics for analysis:

```bash
# Example cron job to collect metrics every 5 minutes
*/5 * * * * curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://your-api.com/monitoring/metrics >> /var/log/app-metrics.log
```

### 3. Alert Configuration

Configure alerts based on health checks and metrics:

- **Database Unhealthy**: Immediate alert
- **Memory Usage > 90%**: Warning alert
- **High Response Times**: Performance degradation alert
- **Error Rate Spike**: Investigation required

### 4. Log Aggregation

For production environments, integrate with log aggregation services:

- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Splunk**
- **Datadog**
- **New Relic**
- **AWS CloudWatch**

## Security Considerations

1. **Health Endpoint**: Public access for load balancers and monitoring services
2. **Metrics & Logs**: Admin-only access to prevent information disclosure
3. **Sensitive Data**: Request body data is NOT logged to prevent credential exposure
4. **Rate Limiting**: Consider adding rate limiting to monitoring endpoints

## Performance Impact

The monitoring system is designed with minimal performance overhead:

- **Logging Interceptor**: ~1-2ms per request
- **Health Check**: ~10-50ms (includes database query)
- **Metrics Collection**: <1ms (synchronous, in-memory)

## Troubleshooting

### Common Issues

#### 1. Health Check Fails

**Symptom:** Health endpoint returns unhealthy status

**Solutions:**
- Check database connectivity
- Verify DATABASE_URL environment variable
- Check memory usage (may need to increase container limits)

#### 2. High Memory Usage

**Symptom:** Memory usage consistently above 90%

**Solutions:**
- Review application for memory leaks
- Increase container memory limits
- Consider horizontal scaling

#### 3. Logs Not Appearing

**Symptom:** Expected logs not visible

**Solutions:**
- Check LOG_LEVEL environment variable
- Verify logging interceptor is registered globally
- Check console output or log aggregation service

## API Reference

### Health Check

```
GET /monitoring/health
```

Returns application health status.

**Response Codes:**
- `200 OK`: Health check completed (check status field for actual health)

### Metrics

```
GET /monitoring/metrics
```

Returns application performance metrics.

**Authentication:** Required (Admin JWT)

**Response Codes:**
- `200 OK`: Metrics retrieved successfully
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User is not an admin

### Logs

```
GET /monitoring/logs?limit=100&level=error
```

Returns application logs (filtered by parameters).

**Authentication:** Required (Admin JWT)

**Query Parameters:**
- `limit` (optional): Number of logs to return
- `level` (optional): Log level filter

**Response Codes:**
- `200 OK`: Logs retrieved successfully
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User is not an admin

## Future Enhancements

Potential improvements for the monitoring system:

1. **Custom Metrics**: Add business-specific metrics (tickets created, response times, etc.)
2. **Real-time Monitoring**: WebSocket-based real-time metrics streaming
3. **Historical Data**: Store and visualize historical metrics
4. **Alerting System**: Built-in alert rules and notification system
5. **Performance Tracing**: Distributed tracing with OpenTelemetry
6. **Custom Dashboards**: Built-in monitoring dashboard UI

## Related Documentation

- [Docker Documentation](../DOCKER.md)
- [Database Management](../DATABASE_MANAGEMENT.md)
- [API Documentation](../README.md#api-documentation)
