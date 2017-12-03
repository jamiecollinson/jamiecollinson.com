
+++
date = "2017-05-31T20:15:50+01:00"
title = "Faster Command Line Tools in Golang?"
+++

Having read the post [faster command line tools in nim](https://nim-lang.org/blog/2017/05/25/faster-command-line-tools-in-nim.html) by Euan Torano[^1], I wanted to see how Go would compare. I am no golang expert, but have used it in production on a couple of reasonably sized projects, and have recently been enjoying it as a language for creating small terminal applications.

Lest I appear to bury the lede, replicating the functionality in go was pleasant but I'd hoped for better performance.

The task is to take a csv file, a column number to sum by and another to sum, and to return the label and total of the largest value. The following is the original description, with a [40Mb ngram file from Google Books](https://storage.googleapis.com/books/ngrams/books/googlebooks-eng-all-1gram-20120701-0.gz) serving as a test.

> It’s a common programming task: Take a data file with fields separated by a delimiter (comma, tab, etc), and run a mathematical calculation involving several of the fields. Often these programs are one-time use scripts, other times they have longer shelf life. Speed is of course appreciated when the program is used more than a few times on large files.

> The specific exercise we’ll explore starts with files having keys in one field, integer values in another. The task is to sum the values for each key and print the key with the largest sum.

> With the first field as key, second field as value, the key with the max sum is B, with a total of 13.

> Fields are delimited by a TAB, and there may be any number of fields on a line. The file name and field numbers of the key and value are passed as command line arguments.

Let's start by looking at the original python script:

``` python
#!/usr/bin/env python

import argparse
import fileinput
import collections

def main():
    parser = argparse.ArgumentParser(description='Sum a column.')
    parser.add_argument('file', type=open)
    parser.add_argument('key_field_index', type=int)
    parser.add_argument('value_field_index', type=int)

    args = parser.parse_args()
    delim = '\t'

    max_field_index = max(args.key_field_index, args.value_field_index)
    sum_by_key = collections.Counter()

    for line in args.file:
        fields = line.rstrip('\n').split(delim)
        if max_field_index < len(fields):
            sum_by_key[fields[args.key_field_index]] += int(fields[args.value_field_index])

    max_entry = sum_by_key.most_common(1)
    if len(max_entry) == 0:
        print 'No entries'
    else:
        print 'max_key:', max_entry[0][0], 'sum:', max_entry[0][1]

if __name__ == '__main__':
    main()

```

On my 2016 Macbook (Core M7) performance is okay, but doesn't quite have that snappy "compiled language" feel:

``` bash
$ time python2 csvParsePython.py googlebooks-eng-all-1gram-20120701-0.tsv 1 2
max_key: 2006 sum: 22569013

real	0m18.239s
user	0m17.898s
sys	0m0.172s
```

Euan's nim code is appreciably faster. He finds this script 12% faster than LLVM optimized D, and 1250% faster than python:

```
import os, strutils, streams, tables, parsecsv

const
  Delim = '\t'

proc main() =
  if paramCount() < 3:
    quit("synopsis: " & getAppFilename() & " filename keyfield valuefield")

  let
    filename = paramStr(1)
    keyFieldIndex = parseInt(paramStr(2))
    valueFieldIndex = parseInt(paramStr(3))
    maxFieldIndex = max(keyFieldIndex, valueFieldIndex)

  var
    sumByKey = newCountTable[string]()
    file = newFileStream(filename, fmRead)
  if file == nil:
    quit("cannot open the file" & filename)

  defer: file.close()

  var csv: CsvParser
  open(csv, file, filename, separator=Delim)

  while csv.readRow():
    if len(csv.row) > maxFieldIndex - 1:
      sumByKey.inc(csv.row[keyFieldIndex], parseInt(csv.row[valueFieldIndex]))

  if sumByKey.len() == 0:
    echo "No entries"
  else:
    let largest = sumByKey.largest()
    echo "max_key: ", largest[0], " sum: ", largest[1]

main()
```

I find a similar (1150%) speed improvement in nim over python:

``` bash
$ time ./csvParseNim googlebooks-eng-all-1gram-20120701-0.tsv 1 2
max_key: 2006 sum: 22569013

real	0m1.586s
user	0m1.518s
sys	0m0.060s
```

Thus armed I was hoping for a similar order-of-magnitude speed from golang, i.e. an approximately 10x increase in speed over python. I'm not so familiar with nim's performance characteristics, but a quick bit of searching[^2] showed I should expect nim to be perhaps 2x faster than golang.


```
package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"os"
	"strconv"
)

func main() {
	if len(os.Args) < 4 {
		fmt.Printf("usage: %s filename keyfield valuefield\n", os.Args[0])
		return
	}

	fileName := os.Args[1]

	keyField, err := strconv.Atoi(os.Args[2])
	if err != nil {
		fmt.Println("keyfield must be an integer")
		return
	}

	valueField, err := strconv.Atoi(os.Args[3])
	if err != nil {
		fmt.Println("valuefield must be an integer")
	}

	file, err := os.Open(fileName)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.Comma = '\t'
	reader.LazyQuotes = true

	sumByKey := map[string]int{}
	var largestKey string

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		} else if err != nil {
			fmt.Println(err)
			return
		}
		key := record[keyField]
		valueAsString := record[valueField]
		if value, err := strconv.Atoi(valueAsString); err == nil {
			sumByKey[key] += value
			if sumByKey[key] > sumByKey[largestKey] {
				largestKey = key
			}
		}
	}
	fmt.Println(largestKey, sumByKey[largestKey])
}

```

``` bash
$ go version
go version go1.8 darwin/amd64
$ go build csvParser.go
$ time ./csvParser googlebooks-eng-all-1gram-20120701-0.tsv 1 2
2006 22569013

real	0m7.651s
user	0m7.614s
sys	0m0.108s
```

Only 2.4x python and 5x slower than nim? Not exactly what I'd been hoping for while congratulating myself that I'd be able to write faster terminal tools.

```
package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"
)

func main() {
	if len(os.Args) < 4 {
		fmt.Printf("usage: %s filename keyfield valuefield\n", os.Args[0])
		return
	}

	fileName := os.Args[1]

	keyField, err := strconv.Atoi(os.Args[2])
	if err != nil {
		fmt.Println("keyfield must be an integer")
		return
	}

	valueField, err := strconv.Atoi(os.Args[3])
	if err != nil {
		fmt.Println("valuefield must be an integer")
	}

	file, err := os.Open(fileName)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer file.Close()

	reader := bufio.NewReader(file)

	sumByKey := map[string]int{}
	var largestKey string

	for {
		line, _, err := reader.ReadLine()
		if err == io.EOF {
			break
		} else if err != nil {
			fmt.Println(err)
			return
		}

		fields := strings.Split(string(line), "\t")
		key := fields[keyField]
		valueAsString := fields[valueField]
		if value, err := strconv.Atoi(valueAsString); err == nil {
			sumByKey[key] += value
			if sumByKey[key] > sumByKey[largestKey] {
				largestKey = key
			}
		}

	}
	fmt.Println(largestKey, sumByKey[largestKey])
}
```

``` bash
$ time ./csvParser2 googlebooks-eng-all-1gram-20120701-0.tsv 1 2
2006 22569013

real	0m4.133s
user	0m4.102s
sys	0m0.109s
```

4.4x faster than python and 2.6x slower than nim I can live with.

As ever performance is comparative, and depends on your exact use. I expected this to be an easy and convincing victory for golang over python, but it took some tweaking to get a solid win. I didn't really know what to expect on nim vs go[^3] but left impressed with nim's performance and - speaking as a pythonista - elegance.

[^1]: Itself a inspired by [faster command line tools in D](http://dlang.org/blog/2017/05/24/faster-command-line-tools-in-d/) by Jon Degenhardt

[^2]: [this comparison](https://github.com/kostya/benchmarks) was incredibly helpful

[^3]: I had mentally categorised them both as "near C speed", but without much nuance in comparison.
