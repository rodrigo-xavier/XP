import Scripts from './scripts.jsx';
import './index.css';


function App() {
    const getContent = () => {
        return (
            <div>
                <Scripts />
            </div>
        );
      };

      return (
        <>
          {getContent()}
        </>
    );
}

export default App;