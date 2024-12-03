# Starting point:
# def nth_prime(n):
#  # TODO: write a function that returns the n-th prime number
#     pass


def nth_prime_teacher(n):
  primes = []
  i = 2
  while len(primes) < n:
    is_prime = True
    for prime in primes:
      if i % prime == 0:
        is_prime = False
        break
    if is_prime:
      primes.append(i)
    i += 1
  return primes[-1]


def nth_prime_student(n):
  count = 0
  num = 1
  while count < n:
    num += 1
    for i in range(2, int(num ** 0.5) + 1):
      if num % i == 0:
        break
    else:
      count += 1

  return num


def testcode():
  for i in range(1, 5):
    print("Testing your code with input: ", i)
    print("Your solution was: ", nth_prime_student(i))
    print("The correct solution is: ", nth_prime_teacher(i))
    assert nth_prime_teacher(i) == nth_prime_student(i)

    print("\n")
  print("All tests passed.")


testcode()
