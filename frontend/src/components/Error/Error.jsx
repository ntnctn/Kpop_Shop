const Error = ({ message, onRetry }) => (
  <div className="error">
    <p>{message}</p>
    {onRetry && <button onClick={onRetry}>Попробовать снова</button>}
  </div>
);

export default Error;