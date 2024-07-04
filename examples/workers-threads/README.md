# worker-threads

## Without workers

```bash
bun run dev --port 6530
ab -c 100 -t 10 -r http://localhost:6530/
```

```text
Finished 135 requests
Server Software:
Server Hostname:        localhost
Server Port:            6530

Document Path:          /
Document Length:        1000000 bytes

Concurrency Level:      100
Time taken for tests:   11.388 seconds
Complete requests:      135
Failed requests:        0
Total transferred:      165125471 bytes
HTML transferred:       165106381 bytes
Requests per second:    11.85 [#/sec] (mean)
Time per request:       8435.641 [ms] (mean)
Time per request:       84.356 [ms] (mean, across all concurrent requests)
Transfer rate:          14159.97 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.0      0       0
Processing:   126 5091 2057.9   4747    8859
Waiting:       94 4053 2017.1   4625    6805
Total:        126 5091 2057.9   4747    8859

Percentage of the requests served within a certain time (ms)
  50%   4747
  66%   6597
  75%   6895
  80%   6895
  90%   6895
  95%   6895
  98%   8859
  99%   8859
 100%   8859 (longest request)
```

## With workers

```bash
bun run dev --port 6531 --use-workers
ab -c 100 -t 10 -r http://localhost:6531/
```

```text
Finished 338 requests
Server Software:
Server Hostname:        localhost
Server Port:            6531

Document Path:          /
Document Length:        1000000 bytes

Concurrency Level:      100
Time taken for tests:   10.028 seconds
Complete requests:      338
Failed requests:        0
Total transferred:      338044278 bytes
HTML transferred:       338000000 bytes
Requests per second:    33.71 [#/sec] (mean)
Time per request:       2966.837 [ms] (mean)
Time per request:       29.668 [ms] (mean, across all concurrent requests)
Transfer rate:          32920.26 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   1.5      0      14
Processing:   166  366 420.5    277    4856
Waiting:      157  360 420.5    270    4848
Total:        166  366 420.5    277    4856

Percentage of the requests served within a certain time (ms)
  50%    277
  66%    316
  75%    339
  80%    362
  90%    469
  95%    770
  98%   1516
  99%   1932
 100%   4856 (longest request)
```

## Tested on:

```bash
> node 20.14.0
> 16gb ram
──────────────────────────────────────────────────────────────────────────────────────────
Manufacturer     : Intel
Brand            : Core™ i5-8300H
Family           : 6
Model            : 158
Stepping         : 10
Speed            : 2.3
Cores            : 8
PhysicalCores    : 4
PerformanceCores : 8
EfficiencyCores  :
Processors       : 1
Socket           : BGA1440
```
